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
import { Meta, StoryFn } from "@storybook/react";
import * as React from "react";
import { keyResources } from "../../__mocks__/Hierarchy.mock";
import KeyResource, {
  KeyResourceProps,
} from "../../tsrc/hierarchy/components/KeyResource";

export default {
  title: "Hierarchy/KeyResource",
  component: KeyResource,
  argTypes: { onPinIconClick: { action: "PinIcon clicked" } },
} as Meta<KeyResourceProps>;

export const Standard: StoryFn<KeyResourceProps> = (args) => (
  <KeyResource {...args} />
);
Standard.args = {
  item: keyResources[1],
};

export const withDesc: StoryFn<KeyResourceProps> = (args) => (
  <KeyResource {...args} />
);
withDesc.args = {
  item: keyResources[0],
};

export const WithThumb: StoryFn<KeyResourceProps> = (args) => (
  <KeyResource {...args} />
);
WithThumb.args = {
  item: keyResources[2],
};
