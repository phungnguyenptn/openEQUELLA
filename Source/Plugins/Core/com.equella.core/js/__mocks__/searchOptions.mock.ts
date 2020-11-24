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
import { getCollectionMap } from "../__mocks__/getCollectionsResp";
import { SearchOptions } from "../tsrc/modules/SearchModule";
import { users } from "./UserSearch.mock";

export const allSearchOptions: SearchOptions = {
  rowsPerPage: 10,
  currentPage: 0,
  sortOrder: "NAME",
  rawMode: true,
  status: ["LIVE", "REVIEW"],
  searchAttachments: true,
  query: "test machine",
  collections: getCollectionMap,
  selectedCategories: [
    { id: 766943, categories: ["Hobart"] },
    { id: 766944, categories: ["Some cool things"] },
  ],
  lastModifiedDateRange: {
    start: new Date("2020-05-26T13:24:00.889+10:00"),
    end: new Date("2020-05-27T13:24:00.889+10:00"),
  },
  owner: users[0],
};