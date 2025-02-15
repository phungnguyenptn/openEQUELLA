package com.tle.webtests.pageobject.searching;

import com.tle.webtests.framework.PageContext;
import com.tle.webtests.pageobject.generic.component.EquellaSelect;
import com.tle.webtests.pageobject.generic.page.AbstractScreenOptions;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;

public abstract class AbstractSearchPageScreenOptions<T extends AbstractSearchPageScreenOptions<T>>
    extends AbstractScreenOptions<T> {

  private EquellaSelect perPageList;
  private Select newPerPageList;

  // TODO: Remove me in OEQ-1702.
  protected Boolean forceOldUI;

  public AbstractSearchPageScreenOptions(PageContext context) {
    super(context);
    this.forceOldUI = false;
  }

  // TODO: Remove me in OEQ-1702.
  public AbstractSearchPageScreenOptions(PageContext context, Boolean forceOldUI) {
    super(context);
    this.forceOldUI = forceOldUI;
  }

  @Override
  public void checkLoaded() throws Error {
    super.checkLoaded();
    WebElement perPageElem = driver.findElement(By.id("p_pp"));
    if (!forceOldUI && context.getTestConfig().isNewUI()) {
      newPerPageList = new Select(perPageElem);
    } else {
      perPageList = new EquellaSelect(context, perPageElem);
    }
  }

  /**
   * *
   *
   * @param perPage - Must be either min, middle, max
   */
  public void setPerPage(String perPage) {
    if (perPageList != null) {
      perPageList.selectByValue(perPage);
    } else {
      newPerPageList.selectByValue(perPage);
      close();
    }
  }

  public int getPerPage() {
    return Integer.parseInt(perPageList.getSelectedValue());
  }
}
