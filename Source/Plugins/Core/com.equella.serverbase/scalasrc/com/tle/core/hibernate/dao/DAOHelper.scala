package com.tle.core.hibernate.dao

import org.hibernate.Session
import org.hibernate.query.Query

import scala.jdk.CollectionConverters._
import scala.util.Try

/**
  * This object provides helper functions to assist dealing with Hibernate in Scala.
  */
object DAOHelper {
  private def prepareQuery(session: Session, query: String, params: Map[String, Any]): Query[_] = {
    val namedQuery = session.getNamedQuery(query)
    params.foreach {
      case (key, value) => namedQuery.setParameter(key, value)
    }

    namedQuery
  }

  /**
    * This generic function is used to retrieve one entity by the provided parameters. If more than one entities returned
    * in the query result, throw an exception.
    *
    * @param dao Implementation of a DAO.
    * @param query Name of a pre-defined named query used to retrieve some entities.
    * @param params A list of parameters to be applied to the query.
    * @tparam T Type of the entity to be retrieved.
    * @tparam D Type of the DAO which MUST extend AbstractHibernateDao.
    *
    * @return Option of the only entity retrieved or None if no entity found.
    */
  def getOnlyOne[T, D <: AbstractHibernateDao](dao: D,
                                               query: String,
                                               params: Map[String, Any]): Option[T] = {
    Try {
      dao.getHibernateTemplate
        .execute(prepareQuery(_, query, params).getResultList)
        .asScala
        .toList
        .asInstanceOf[List[T]]
    }.toEither
      .filterOrElse(_.size <= 1,
                    new Throwable(s"More than one entities matching the provided parameters"))
      .fold(throw _, _.headOption)
  }

  /**
    * This generic function is used to delete entities by the provided parameters.
    *
    * @param dao Implementation of a DAO.
    * @param query Name of a pre-defined named query used to delete some entities.
    * @param params A list of parameters to be applied to the query.
    * @tparam D Type of the DAO which MUST extend AbstractHibernateDao.
    * @return Either thrown exceptions or the number of entities that have been deleted.
    */
  def delete[D <: AbstractHibernateDao](dao: D,
                                        query: String,
                                        params: Map[String, Any]): Either[Throwable, Int] =
    Try {
      dao.getHibernateTemplate
        .execute(prepareQuery(_, query, params).executeUpdate())
    }.toEither
}
