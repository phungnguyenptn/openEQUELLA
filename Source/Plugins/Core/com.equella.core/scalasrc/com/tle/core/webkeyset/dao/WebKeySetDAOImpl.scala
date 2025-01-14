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

package com.tle.core.webkeyset.dao

import com.tle.beans.webkeyset.WebKeySet
import com.tle.common.institution.CurrentInstitution
import com.tle.core.guice.Bind
import com.tle.core.hibernate.dao.DAOHelper.getOnlyOne
import com.tle.core.hibernate.dao.GenericInstitionalDaoImpl
import javax.inject.Singleton

@Bind(classOf[WebKeySetDAO])
@Singleton
class WebKeySetDAOImpl
    extends GenericInstitionalDaoImpl[WebKeySet, java.lang.Long](classOf[WebKeySet])
    with WebKeySetDAO {
  override def getByKeyID(keyId: String): Option[WebKeySet] =
    getOnlyOne(this, "getByKeyID", Map("keyId" -> keyId, "institution" -> CurrentInstitution.get()))
}
