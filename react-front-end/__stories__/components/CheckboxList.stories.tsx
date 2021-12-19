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
import { Meta, Story } from "@storybook/react";
import * as React from "react";
import {
  CheckboxList,
  CheckboxListProps,
} from "../../tsrc/components/CheckboxList";

export default {
  title: "Component/CheckboxList",
  component: CheckboxList,
  argTypes: {
    onChange: {
      action: "onChange called",
    },
  },
} as Meta<CheckboxListProps>;

export const Basic: Story<CheckboxListProps> = (args) => (
  <CheckboxList {...args} />
);
Basic.args = {
  id: "component-checkboxlist-story",
  options: new Map([
    ["first", "Here's one"],
    ["second", "And another"],
    ["third", "And a third option"],
  ]),
  checked: new Set<string>(),
};

export const WithChecked: Story<CheckboxListProps> = (args) => (
  <CheckboxList {...args} />
);
WithChecked.args = {
  ...Basic.args,
  checked: new Set<string>(["second"]),
};