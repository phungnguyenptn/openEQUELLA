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
import Axios from "axios";
import { API_BASE_URL } from "../AppConfig";
import type { ChangeRoute } from "../legacycontent/LegacyContent";
import type { ScrapbookType } from "./ScrapbookModule";

const legacyMyResourcesUrl = `${API_BASE_URL}/content/submit/access/myresources.do`;

/**
 * Given a Scrapbook type which is either "file" or "page", return a route for
 * accessing the Legacy Scrapbook creating page.
 */
export const getLegacyScrapbookCreatingPageRoute = async (
  scrapbookType: ScrapbookType
): Promise<string> =>
  Axios.post<ChangeRoute>(legacyMyResourcesUrl, {
    event__: [`${scrapbookType === "file" ? "cmca" : "cmca2"}.contribute`],
  }).then(({ data: { route } }) => `/${route}`);

/**
 * Returns a route for accessing the Legacy Scrapbook editing page.
 *
 * @param itemKey Unique key of the Scrapbook including the UUID and version.
 */
export const getLegacyScrapbookEditingPageRoute = async (
  itemKey: string
): Promise<string> =>
  Axios.post<ChangeRoute>(legacyMyResourcesUrl, {
    event__: ["mcile.edit"],
    eventp__0: [itemKey],
  }).then(({ data: { route } }) => `/${route}`);
