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
import type { Meta, StoryFn } from "@storybook/react";
import * as React from "react";
import {
  ResourceSelector,
  ResourceSelectorProps,
} from "../../tsrc/search/components/ResourceSelector";
import { languageStrings } from "../../tsrc/util/langstrings";

export default {
  title: "Search/ResourceSelector",
  component: ResourceSelector,
  argTypes: {
    onClick: { action: "on select resources" },
  },
} as Meta<ResourceSelectorProps>;

export const StandardSelector: StoryFn<ResourceSelectorProps> = (args) => (
  <ResourceSelector {...args} />
);

StandardSelector.args = {
  labelText: languageStrings.searchpage.selectResource.summaryPage,
  isStopPropagation: true,
};
