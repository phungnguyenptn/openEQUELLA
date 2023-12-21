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

package com.tle.common.security.streaming;

import com.thoughtworks.xstream.XStream;

public class XStreamSecurityManager {
  public static void applyPolicy(XStream xstream) {
    // Anything you want to be XStream'd needs to be allowed here
    xstream.allowTypesByWildcard(
        new String[] {
          "com.tle.**", "com.dytech.**",
        });
  }

  // Helper method to have ALL XStream instances be covered by
  // the oEQ policy(ies) in this manager.
  public static XStream newXStream() {
    XStream xs = new XStream();
    applyPolicy(xs);
    return xs;
  }
}
