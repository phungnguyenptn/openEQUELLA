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
import ErrorOutline from "@mui/icons-material/ErrorOutline";
import {
  Divider,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import * as EQ from "fp-ts/Eq";
import { pipe } from "fp-ts/function";
import * as ORD from "fp-ts/Ord";
import * as RA from "fp-ts/ReadonlyArray";
import * as RS from "fp-ts/ReadonlySet";
import * as S from "fp-ts/string";
import * as React from "react";
import { useState } from "react";
import type { BaseSecurityEntity } from "../../modules/ACLEntityModule";
import { languageStrings } from "../../util/langstrings";
import ConfirmDialog from "../ConfirmDialog";

export interface SelectEntityDialogProps<T extends BaseSecurityEntity> {
  /** Open the dialog when true. */
  open: boolean;
  /** The title of the dialog for selector. */
  title: string;
  /** The currently selected security entities. */
  value: ReadonlySet<T>;
  /** Order used to sort items.*/
  itemOrd: ORD.Ord<T>;
  /**
   * Function to build a display component for the provided security entity.
   * Ideally the element will be `SecurityEntityEntry`.
   *
   * @param entity Entity to display.
   * @param onDelete function to handle delete event.
   */
  entityDetailsToEntry: (entity: T, onDelete: () => void) => JSX.Element;
  /** Handler for when user confirms (press ok button) the selections. */
  onConfirm: (selections: ReadonlySet<T>) => void;
  /** Handler for when user cancel (press cancel button or click the area where outside dialog) the selections. */
  onCancel: () => void;
  /**
   * Function use to build the search component specific to the type of security entity to be searched.
   * Receives the various handlers for that component, and returns the completed search component.
   *
   * @param selection Initial selected entity.
   * @param setSelection SetState function to update selected entity.
   * @param confirmSelect Triggered when user clicks the select button in search component.
   *                      Note it's different from the OK button in dialog.
   */
  searchComponent: (
    selection: ReadonlySet<T>,
    setSelection: (selection: ReadonlySet<T>) => void,
    confirmSelect: () => void
  ) => JSX.Element;
  /** The message is displayed in the right-hand result list when there is no selected entity. */
  addEntityMessage: string;
}

const { ok: okLabel } = languageStrings.common.action;
const { currentSelections: currentSelectionsLabel } =
  languageStrings.selectEntityDialog;
/**
 * This component provides a template for a standard dialog used for searching for security entities,
 * and making selections of those entities. The search component is displayed on the left hand side,
 * from which a user can make selections which will then be added to a list on the right hand side.
 * When the user confirms the dialog (click's OK),
 * that list of users on the right hand side is returned to the calling component.
 */
const SelectEntityDialog = <T extends BaseSecurityEntity>({
  open,
  title,
  value,
  itemOrd,
  entityDetailsToEntry,
  onConfirm,
  onCancel,
  searchComponent,
  addEntityMessage,
}: SelectEntityDialogProps<T>) => {
  const [searchSelections, setSearchSelections] = useState<ReadonlySet<T>>(
    RS.empty
  );
  // state for final selections which will be returned to the calling component when the user clicks OK
  const [selectedEntities, setSelectedEntities] =
    useState<ReadonlySet<T>>(value);

  const eqByID = EQ.contramap<string, T>((entry: T) => entry.id)(S.Eq);

  const handleConfirm = () => {
    onConfirm(selectedEntities);
    setSearchSelections(RS.empty);
  };

  const handleCancel = () => {
    onCancel();
    setSelectedEntities(value);
    setSearchSelections(RS.empty);
  };

  const handleDeleteForEachEntry = (entity: T) =>
    pipe(
      selectedEntities,
      RS.remove(EQ.contramap<string, T>((entry: T) => entry.id)(S.Eq))(entity),
      setSelectedEntities
    );

  const hasSelectedEntities = !RS.isEmpty(selectedEntities);

  return (
    <ConfirmDialog
      title={title}
      open={open}
      confirmButtonText={okLabel}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      maxWidth="md"
    >
      <Grid container>
        <Grid item xs>
          {searchComponent(searchSelections, setSearchSelections, () =>
            pipe(value, RS.union(eqByID)(searchSelections), setSelectedEntities)
          )}
        </Grid>
        <Divider orientation="vertical" flexItem light sx={{ margin: "5px" }} />
        <Grid item xs>
          {/*paddingLeft is used to align title with the list icon below it*/}
          <Typography variant="h6" sx={{ paddingLeft: "16px" }}>
            {currentSelectionsLabel}
          </Typography>
          <List disablePadding>
            {hasSelectedEntities ? (
              pipe(
                selectedEntities,
                RS.toReadonlyArray(itemOrd),
                RA.map((entity) =>
                  entityDetailsToEntry(entity, () =>
                    handleDeleteForEachEntry(entity)
                  )
                )
              )
            ) : (
              <ListItem>
                <ListItemIcon>
                  <ErrorOutline />
                </ListItemIcon>
                <ListItemText secondary={addEntityMessage} />
              </ListItem>
            )}
          </List>
        </Grid>
      </Grid>
    </ConfirmDialog>
  );
};

export default SelectEntityDialog;
