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
import * as OEQ from "@openequella/rest-api-client";
import * as A from "fp-ts/Array";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import { constant, flow, pipe } from "fp-ts/function";

/**
 * Contains 3 resolvers for functions to lookup user, group and role entities
 */
export interface ACLEntityResolvers {
  /**
   * Lookup user known in oEQ.
   */
  resolveUserProvider: (
    id: string
  ) => Promise<OEQ.UserQuery.UserDetails | undefined>;
  /**
   * Lookup group known in oEQ.
   */
  resolveGroupProvider: (
    id: string
  ) => Promise<OEQ.UserQuery.GroupDetails | undefined>;
  /**
   * Lookup role known in oEQ.
   */
  resolveRoleProvider: (
    id: string
  ) => Promise<OEQ.UserQuery.RoleDetails | undefined>;
}

/**
 * Generic function for finding an entity's details by ID.
 *
 * @param entityId The unique ID of an entity
 * @param resolveEntities The function used to get the entity by id
 */
export const findEntityById = async <T>(
  entityId: string,
  resolveEntities: (ids: ReadonlyArray<string>) => Promise<T[]>
): Promise<T | undefined> =>
  pipe(
    await resolveEntities([entityId]),
    E.fromPredicate(
      (a) => a.length <= 1,
      constant(`More than one entity was resolved for id: ${entityId}`)
    ),
    E.map(flow(A.head, O.toUndefined)),
    E.getOrElseW((error) => {
      throw new Error(error);
    })
  );
