/*
 * Licensed to The Apereo Foundation under one or more contributor license
 * agreements. See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 * The Apereo Foundation licenses this file to you under the Apache License,
 * Version 2.0, (the "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at:
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as A from "fp-ts/Array";
import * as E from "fp-ts/Either";
import { flow, identity, pipe } from "fp-ts/function";
import { Monoid } from "fp-ts/Monoid";
import * as O from "fp-ts/Option";
import { not } from "fp-ts/Predicate";
import * as NEA from "fp-ts/NonEmptyArray";
import * as RA from "fp-ts/ReadonlyArray";
import * as RNEA from "fp-ts/ReadonlyNonEmptyArray";
import { ReadonlyNonEmptyArray } from "fp-ts/ReadonlyNonEmptyArray";
import * as S from "fp-ts/string";
import { Literal, Static, Union } from "runtypes";
import { pfTernary, pfTernaryTypeGuard } from "../util/pointfree";

/**
 * ACL Operator types:
 *
 * `UNKNOWN` is only used as a placeholder while parsing an ACL recipient string.
 */
const ACLOperatorTypesUnion = Union(
  Literal("OR"),
  Literal("AND"),
  Literal("NOT"),
  Literal("UNKNOWN")
);

type ACLOperatorType = Static<typeof ACLOperatorTypesUnion>;

/**
 * ACL Recipient types:
 * * user: U:xxx-xxx-xxx
 * * group: G:xxx-xxx-xxx
 * * role: R:xxx-xxx-xxx
 * * owner: $OWNER
 * * everyone: *
 * * refer: F:xxx
 * * IP: I:255.255.0.0%2F24
 * * Sso: T:xxx
 */
export const ACLRecipientTypes = {
  User: "U",
  Group: "G",
  Role: "R",
  Everyone: "*",
  Owner: "$OWNER",
  Refer: "F",
  Ip: "I",
  Sso: "T",
};

const ACLRecipientTypesUnion = Union(
  Literal(ACLRecipientTypes.User),
  Literal(ACLRecipientTypes.Group),
  Literal(ACLRecipientTypes.Role),
  Literal(ACLRecipientTypes.Everyone),
  Literal(ACLRecipientTypes.Owner),
  Literal(ACLRecipientTypes.Refer),
  Literal(ACLRecipientTypes.Ip),
  Literal(ACLRecipientTypes.Sso)
);

type ACLRecipientType = Static<typeof ACLRecipientTypesUnion>;

/**
 * Represents a recipient in the ACL expression.
 *
 * Examples:
 * - [types]: [expressions]
 * - user: U:f4c788d1-6e97-5247-e06c-3d4982b9469a
 * - user: U:trish.ahsam
 * - group: G:d72eb802-0ea6-4384-907a-341ee60628c0
 * - role: R:366ac350-4eaa-4377-8f1c-e1b12da96d64
 * - role: R:ROLE_CONTENT_ADMINISTRATOR
 * - owner: $OWNER
 * - everyone: *
 * - refer: F:https://edalex.com
 * - refer: F:*edalex*
 * - IP: I:255.255.0.0%2F24
 * - Sso: T:moodle
 */
export interface ACLRecipient {
  /** Represents the type of ACL recipient. */
  type: ACLRecipientType;
  /** A human-readable name for the recipient. */
  name: string;
  /** The raw recipient expression text without type. */
  expression: string;
}

/**
 * Show the full raw expression string for an ACL Recipient.
 *
 * For `Everyone` and `Owner`, directly return the expression.
 * For other types return the expression with type prefix.
 */
const showRecipient = ({ type, expression }: ACLRecipient) =>
  type === ACLRecipientTypes.Owner || type === ACLRecipientTypes.Everyone
    ? expression
    : `${type}:${expression}`;

/**
 * Represents the ACL Expression string.
 *
 * A raw ACL Expression string can be parsed into an ACLExpression object.
 * And an ACLExpression object can also generate a raw ACL Expression string.
 */
export interface ACLExpression {
  /**
   * Operator relationship between recipient and children.
   */
  operator: ACLOperatorType;
  /**
   * A list of target that will be authorised or unauthorised.
   */
  recipients: ACLRecipient[];
  /**
   * A list of sub ACL expression.
   */
  children: ACLExpression[];
}

/**
 * Generate ACLExpression object to a readable string format, mainly used for debug.
 */
export const generateACLExpressionDisplayString = (
  { operator, children, recipients }: ACLExpression,
  padding = ""
): string =>
  pipe(
    [padding, operator],
    A.concat(recipients.map((r) => showRecipient(r))),
    A.intercalate(S.Monoid)(" "),
    A.of,
    A.concat(
      pipe(
        children,
        A.map((c) => generateACLExpressionDisplayString(c, padding + " "))
      )
    ),
    A.intercalate(S.Monoid)("\n")
  );

/**
 * Parse a given string and return corresponding ACL Recipient type.
 */
const parseACLRecipientTypeEither = (
  text: string
): E.Either<string, ACLRecipientType> =>
  pipe(
    text,
    S.split(":"),
    RNEA.head,
    E.fromPredicate(
      ACLRecipientTypesUnion.guard,
      (invalid) => `Failed to parse recipient: ${invalid}`
    )
  );

/**
 * Given an expected ACL Recipient expression, will attempt the parse the string and return a new
 * `ACLRecipient`. However, if there are issues then an error string will be captured in `left`.
 *
 * TODO: name will be fetched from API, currently use `expression` as a placeholder.
 */
export const createACLRecipientEither = (
  expression: string
): E.Either<string, ACLRecipient> =>
  pipe(
    expression,
    parseACLRecipientTypeEither,
    E.map((recipientType) => ({
      name: expression,
      expression: pipe(expression, S.split(":"), RNEA.last),
      type: recipientType,
    }))
  );

/**
 * Create a new object of ACLExpression through given params.
 */
export const createACLExpression = (
  operator: ACLOperatorType,
  recipients: ACLRecipient[] = [],
  children: ACLExpression[] = []
): ACLExpression => ({
  operator: operator,
  recipients: [...recipients],
  children: [...children],
});

/**
 * Creates a new `ACLExpression` based on the provided `expression` with the additional `recipients` added.
 */
const addRecipients =
  (recipients: ACLRecipient[]) =>
  (expression: ACLExpression): ACLExpression => ({
    ...expression,
    recipients: pipe(expression.recipients, A.concat(recipients)),
  });

/**
 * Creates a new `ACLExpression` based on the provided `expression` with the additional `children` added.
 */
const addChildren =
  (child: ACLExpression[]) =>
  (expression: ACLExpression): ACLExpression => ({
    ...expression,
    children: pipe(expression.children, A.concat(child)),
  });

/**
 * Get the number of recipients for a given ACLExpression.
 */
const getRecipientCount = (expression: ACLExpression): number =>
  pipe(expression.recipients, A.size);

/**
 * Tells whether the provide piece of text is an ACL Operator.
 */
const isACLOperator = (text: string): text is ACLOperatorType =>
  ACLOperatorTypesUnion.guard(text);

/**
 * Merge a given base ACL Expression with a new ACL Expression.
 *
 * If the new ACLExpression's operator is `UNKNOWN` or same with the base ACLExpression,
 * then generate a new ACLExpression with both recipients and children from the two ACLExpressions.
 *
 * Otherwise, generate a new ACLExpression which regard the new ACLExpression as a child of the basement ACLExpression.
 *
 * Example 1:
 * ```
 * {
 *   operator: "AND",
 *   recipients: [A, B],
 *   children: [child1]
 * } merge with
 * {
 *   operator: "AND",
 *   recipients: [C],
 *   children: [child2]
 * } =
 * {
 *   operator: "AND",
 *   recipients: [A, B, C],
 *   children: [child1, child2]
 * }
 * ```
 *
 * Example 2:
 * ```
 * {
 *   operator: "AND",
 *   recipients: [A, B],
 *   children: [child1]
 * } merge with
 * {
 *   operator: "OR",
 *   recipients: [C],
 *   children: [child2]
 * } =
 * {
 *   operator: "AND",
 *   recipients: [A, B],
 *   children: [
 *     child1,
 *     {
 *       operator: "OR",
 *       recipients: [C],
 *       children: [child2]
 *     }
 *   ]
 * }
 * ```
 */
const merge = (
  baseExpression: ACLExpression,
  newExpression: ACLExpression
): ACLExpression => {
  // TODO: need discuss what should do if baseExpression and newExpression have same `NOT` operator.
  // Tow options:
  // 1. In theory it would never need to merge two `NOT` ACLExpressions, so need return an Either here.
  // 2. We can just let new implementation support it.
  return baseExpression.operator === newExpression.operator ||
    newExpression.operator === "UNKNOWN"
    ? pipe(
        baseExpression,
        addChildren(newExpression.children),
        addRecipients(newExpression.recipients)
      )
    : pipe(baseExpression, addChildren([newExpression]));
};

/**
 * Build an ACLExpression from the given text.
 *
 * Example 1:
 *
 * Text:
 * ```
 * "U:USER1"
 * ```
 * Result:
 * ```
 * {
 *   operator: "UNKNOWN",
 *   recipient: [ USER1 ],
 *   children: []
 * }
 *```
 *
 * Example 2:
 *
 * Text:
 * ```
 * "AND"
 * ```
 * Result:
 * ```
 * {
 *   operator: "AND",
 *   recipient: [],
 *   children: []
 * }
 * ```
 */
const buildACLExpression = (text: string): E.Either<string, ACLExpression> =>
  pipe(
    text,
    pfTernaryTypeGuard(
      isACLOperator,
      flow(createACLExpression, E.right),
      flow(
        createACLRecipientEither,
        E.map((recipient) => createACLExpression("UNKNOWN", [recipient]))
      )
    )
  );

/**
 * Tells how many operands (`ACLExpression`s) the given operator supports. That is, NOT can only work with
 * one operand, however AND/OR are binary operators and can work on two operands.
 */
const howManyOperands = (operator: ACLOperatorType) =>
  operator === "NOT" ? 1 : 2;

/**
 * Used to track the Parser's state while processing an ACL Expression string.
 */
interface AclExpressionBuildingState {
  /** The holder for the final result as it is being constructed. */
  result: ACLExpression;
  /**
   * A LIFO stack of the immediate previous expressions which are merged with subsequent expressions
   * as the parsing progresses.
   */
  previousExpressions: ACLExpression[];
}

/**
 * Parse a raw ACL expression string and return an object of ACLExpression.
 *
 * First it will get a list of raw expressions from string and wrap them into ACLExpression objects.
 *
 * Then it will then traverse all objects, and generate the result we want.
 *
 * Details of traverse (function parseACLExpressions):
 *
 * If there is only one `ACLExpression` in the list direct return it with `OR` operator.
 *
 * Traverse all ``ACLExpression`` in the list, if the text belongs to recipient before wrap, put it into the pending list(previousExpressions).
 * If it belongs to the operator before wrap, then extract 1 or 2 ACLExpression object from the pending list according to the type of operator.
 * The ACLExpressions extracted from pending list, will be merged into current ACLExpression and become a new result.
 * It will also generate a new pending list(previousExpressions) which excludes the expressions we already merged but includes the new result which will wait for the next iteration.
 *
 * Example 1:
 * expression: A B AND C OR
 * ```
 * iteration 1:
 * {
 *   result: ()
 *   previousExpressions: [A]
 * }
 * iteration 2:
 * {
 *   result: ()
 *   previousExpressions: [A, B]
 * }
 * iteration 3:
 * {
 *   result: (A B AND)
 *   previousExpressions: [(A B AND)]
 * }
 * iteration 4:
 * {
 *   result: (A B AND)
 *   previousExpressions: [(A B AND), C]
 * }
 * iteration 5:
 * {
 *   result: (A B AND C OR)
 *   previousExpressions: [(A B AND C OR)]
 * }
 * ```
 *
 * Example 2:
 * expression: A B C OR NOT AND
 * ```
 * iteration 1:
 * {
 *   result: ()
 *   previousExpressions: [A]
 * }
 * iteration 2:
 * {
 *   result: ()
 *   previousExpressions: [A, B]
 * }
 * iteration 3:
 * {
 *   result: ()
 *   previousExpressions: [A, B, C]
 * }
 * iteration 4:
 * {
 *   result: (B C OR)
 *   previousExpressions: [A, (B C OR)]
 * }
 * iteration 5:
 * {
 *   result: (B C OR NOT)
 *   previousExpressions: [A, (B C OR NOT)]
 * }
 * iteration 6:
 * {
 *   result: (B C OR NOT AND)
 *   previousExpressions: [(A B C OR NOT AND)]
 * }
 * ```
 *
 * @param expression Raw ACL expression string.
 */
export const parse = (
  expression: string
): E.Either<string[], ACLExpression> => {
  /**
   * Assumes `currentExpression` has an operator other than `UNKNOWN` then merges the `previousExpressions` from state into the `currentExpression`.
   * It then returns a new state object where the result is updated to the output of the merging,
   * and the `previousExpressions` are updated to drop those which have been used with result appended to the end.
   */
  const handleKnownExpression = (
    { result, previousExpressions }: AclExpressionBuildingState,
    currentExpression: ACLExpression
  ): AclExpressionBuildingState =>
    pipe(
      previousExpressions,
      A.takeRight(howManyOperands(currentExpression.operator)),
      A.reduce<ACLExpression, ACLExpression>(
        currentExpression,
        (mergedExpressions, nextExpression) =>
          merge(mergedExpressions, nextExpression)
      ),
      (fullExpression) => ({
        result: fullExpression,
        previousExpressions: pipe(
          previousExpressions,
          A.dropRight(howManyOperands(currentExpression.operator)),
          A.append(fullExpression)
        ),
      })
    );

  /**
   * Assumes `currentExpression` has an operator of `UNKNOWN` and appends it to the existing `previousExpressions` before returning the updated state.
   */
  const handleUnknownExpression = (
    { result, previousExpressions }: AclExpressionBuildingState,
    currentExpression: ACLExpression
  ) => ({
    result,
    previousExpressions: [...previousExpressions, currentExpression],
  });

  /**
   * Traverse a give aclExpression list, merge them one by one and generate a final ACLExpression object.
   */
  const parseACLExpressions = (
    aclExpressions: ReadonlyNonEmptyArray<ACLExpression>
  ): ACLExpression =>
    pipe(
      aclExpressions,
      O.fromPredicate((a) => RA.size(a) > 1),
      O.match(
        () =>
          // If there is only one 'ACLExpression' then that means it should be a recipient,
          // and we simply wrap that in an 'OR' and return it.
          createACLExpression(
            "OR",
            pipe(
              aclExpressions,
              RNEA.head,
              (expression) => expression.recipients
            )
          ),
        (expressions) =>
          pipe(
            expressions,
            RA.reduce<ACLExpression, AclExpressionBuildingState>(
              {
                result: {
                  operator: "UNKNOWN",
                  recipients: [],
                  children: [],
                },
                previousExpressions: [],
              },
              (currentState, currentExpression) => {
                const handler =
                  currentExpression.operator !== "UNKNOWN"
                    ? handleKnownExpression
                    : handleUnknownExpression;
                return handler(currentState, currentExpression);
              }
            ),
            ({ result }) => result
          )
      )
    );

  return pipe(
    expression,
    S.split(" "),
    RA.filter(not(S.isEmpty)),
    RA.map(buildACLExpression),
    E.fromPredicate(not(RA.some(E.isLeft)), (errors) =>
      pipe(errors, RA.lefts, RA.toArray)
    ),
    E.chain((expressions) =>
      pipe(
        expressions,
        RA.rights,
        RNEA.fromReadonlyArray,
        O.map(parseACLExpressions),
        E.fromOption(() => ["Received empty ACLExpression list"])
      )
    )
  );
};

/**
 * Remove redundant expressions, and return a new ACLExpression object.
 */
export const removeRedundantExpressions = (aclExpression: ACLExpression) => {
  /**
   * Return a new AclExpression without any empty children (recursively).
   * Empty ACLExpression means it doesn't have any children and recipients.
   *
   * Example:
   *
   * input:
   * ```
   * AND A B C
   *   OR
   *   OR D E
   *      AND F G
   *      AND
   * ```
   * output:
   * ```
   * AND A B C
   *   OR D E
   *     AND F G
   * ```
   */
  const filterEmptyChildren = (expression: ACLExpression): ACLExpression =>
    pipe(
      expression.children,
      A.filter(
        ({ children, recipients }) =>
          A.isNonEmpty(children) || A.isNonEmpty(recipients)
      ),
      A.map(filterEmptyChildren),
      (results) =>
        createACLExpression(
          expression.operator,
          [...expression.recipients],
          [...results]
        )
    );

  /**
   * If a child has same operator with parent or a child only has one recipient,
   * merge this child's recipients and children into parents (recursively).
   * Besides, the above rules will not apply to a child if it's operator is "NOT".
   *
   * Return a new AclExpression without any children which has same operator with itself.
   *
   * Example 1:
   *
   * input:
   * ```
   * OR A B C
   *   OR D E
   * ```
   * output:
   * ```
   * OR A B C D E
   * ```
   *
   * Example 2:
   *
   * input:
   * ```
   * OR A B C
   *   AND D
   * ```
   * output:
   * ```
   * OR A B C D
   * ```
   */
  const mergeChildren = (expression: ACLExpression): ACLExpression => {
    /** Does this expression have _only_ a single recipient and no children? */
    const singleRecipientOnlyExpression = (e: ACLExpression): boolean =>
      getRecipientCount(e) === 1 && A.isEmpty(e.children);

    const mergeChildrenMonoid: Monoid<ACLExpression> = {
      empty: createACLExpression(expression.operator, [
        ...expression.recipients,
      ]),
      concat: (x: ACLExpression, y: ACLExpression): ACLExpression =>
        y.operator !== "NOT" && singleRecipientOnlyExpression(y)
          ? addRecipients(y.recipients)(x)
          : merge(x, y),
    };

    return pipe(
      expression.children,
      A.foldMap(mergeChildrenMonoid)(mergeChildren)
    );
  };

  return pipe(aclExpression, filterEmptyChildren, mergeChildren);
};

/**
 * Generate postfix Acl expression strings, and store them in an array, and later they can be combined as a single string easily.
 *
 * First if the ACLExpression only has one recipient and the operator is not `NOT` just return the expression itself.
 * If it has more than one recipient, for each two recipients it will insert an operator and then if the number of recipient is odd, insert another operator at the end.
 * Then start to process each child.
 * Finally, insert an operator after each child's result.
 *
 * Example 1:
 *
 * input:
 * ```
 * AND A
 *   OR B C
 * ```
 *
 * result:
 * ```
 *  [A]
 *  [A, AND]
 *  [A, AND, B]
 *  [A, AND, B, C]
 *  [A, AND, B, C, OR]
 * ```
 * Example 1:
 *
 * input:
 * ```
 * AND A B C
 * ```
 *
 * result:
 * ```
 *  [A]
 *  [A, B]
 *  [A, B, AND]
 *  [A, B, AND, C]
 *  [A, B, AND, C, AND]
 * ```
 * Example 2:
 *
 * input:
 * ```
 * AND A
 *   OR B C
 * ```
 *
 * result:
 * ```
 *  [A]
 *  [A, AND]
 *  [A, AND, B]
 *  [A, AND, B, C]
 *  [A, AND, B, C, OR]
 * ```
 */
const generatePostfixResults = (aclExpression: ACLExpression): string[] => {
  // For expressions with single recipients:
  // 1. If the expression has an operator of NOT then return an array of `[expression, NOT]`
  // 2. Otherwise, encapsulate the expression in a single element array. i.e. `[expression]`
  const handleSingleRecipient = (
    operator: ACLOperatorType,
    recipient: ACLRecipient
  ): string[] =>
    operator === "NOT"
      ? [showRecipient(recipient), operator]
      : [showRecipient(recipient)];

  const reduceRecipients = (
    operator: ACLOperatorType,
    recipients: ACLRecipient[]
  ): string[] =>
    pipe(
      recipients,
      A.reduceWithIndex<ACLRecipient, string[]>(
        [],
        (index, acc, currentRecipient) => {
          const result = [...acc, showRecipient(currentRecipient)];

          // After every two recipients, make sure to add the operator
          return (index + 1) % 2 === 0 ? [...result, operator] : result;
        }
      ),
      // Make sure the operator is always added on the end - especially for odd numbered
      // recipient lists
      pfTernary(
        (a) => A.isNonEmpty(a) && NEA.last(a) !== operator,
        A.append(operator as string),
        identity
      )
    );

  return pipe(
    // Process the recipients
    aclExpression,
    ({ operator, recipients }: ACLExpression) =>
      A.isNonEmpty(recipients) && A.size(recipients) === 1
        ? handleSingleRecipient(operator, NEA.head(recipients))
        : reduceRecipients(operator, recipients),
    // ... then process the children
    (currentResult) =>
      pipe(
        aclExpression.children,
        A.reduce<ACLExpression, string[]>(
          currentResult,
          (result, childExpression) => [
            ...result,
            ...generatePostfixResults(childExpression),
            aclExpression.operator,
          ]
        )
      )
  );
};

/**
 * Generate postfix Acl expression which will stored in DB.
 *
 * Note: in old implementation all the expression stored in DB will end with a blank space except those "singular" expression.
 * Here don't have this end space since it's useless.
 *
 * Example of "singular" expression:
 * - *
 * - $owner
 * - U:user-id
 */
export const generate = (aclExpression: ACLExpression): string =>
  pipe(aclExpression, generatePostfixResults, A.intercalate(S.Monoid)(" "));
