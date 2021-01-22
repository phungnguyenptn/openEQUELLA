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
import { Grid, IconButton } from "@material-ui/core";
import AddCircleIcon from "@material-ui/icons/AddCircle";
import CancelIcon from "@material-ui/icons/Cancel";
import Axios from "axios";
import * as React from "react";
import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  AjaxFileEntry,
  buildMaxAttachmentWarning,
  cancelUpload,
  deleteUpload,
  generateLocalFile,
  generateUploadedFileComparator,
  generateUploadingFileComparator,
  isUpdateEntry,
  isUploadedFile,
  newUpload,
  updateCtrlErrorText,
  updateDuplicateMessage,
  UpdateEntry,
  UploadedFile,
  UploadFailed,
  UploadingFile,
} from "../modules/FileUploaderModule";
import {
  addElement,
  deleteElement,
  replaceElement,
} from "../util/ImmutableArrayUtil";
import { UploadAction } from "./UploadActions";
import { UploadList } from "./UploadList";

/**
 * Data structure for all strings from the server.
 */
interface ControlStrings {
  edit: string;
  replace: string;
  delete: string;
  deleteConfirm: string;
  cancel: string;
  add: string;
  drop: string;
  none: string;
  preview: string;
  toomany: string;
  toomany_1: string;
}

/**
 * Data structure matching the props server passes in
 */
export interface InlineFileUploaderProps {
  /**
   * The root HTML Element under which this component gets rendered
   */
  elem: Element;
  /**
   * The root ID of an Attachment Wizard Control
   */
  ctrlId: string;
  /**
   * A list of files that have been uploaded to server
   */
  entries: AjaxFileEntry[];
  /**
   * The number of maximum attachments
   */
  maxAttachments: number | null;
  /**
   * Whether uploading files is allowed
   */
  canUpload: boolean;
  /**
   * The function used to open the Universal Resource Dialog to update a uploaded file
   * @param replaceUuid The ID of a file that is the replacement of a selected file
   * @param editUuid The ID of a selected file
   */
  dialog: (replaceUuid: string, editUuid: string) => void;
  /**
   * Whether editing files is allowed
   */
  editable: boolean;
  /**
   * The URL used to initialise or delete an upload
   */
  commandUrl: string;
  /**
   * A number of language strings defined on server
   */
  strings: ControlStrings;
  /**
   * The function used to reload the Wizard state
   */
  reloadState: () => void;
}

/**
 * This component is used for selecting and uploading local files to server.
 * It supports 'Drag and Drop', multiple selections, and common actions such as
 * editing, replacing and deleting uploaded files.
 *
 * Also, upload restrictions configured on server are applied.
 *
 * However, this component should be used in the context of Legacy Wizard page
 * at the moment because all required props is only available on server.
 */
export const InlineFileUploader = ({
  ctrlId,
  entries,
  maxAttachments,
  canUpload,
  dialog: openDialog,
  editable,
  commandUrl,
  strings,
  reloadState,
}: InlineFileUploaderProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(
    entries.map((entry) => ({
      fileEntry: entry,
      status: "uploaded",
    }))
  );
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [fileCount, setFileCount] = useState<number>(entries.length);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState<
    boolean | undefined
  >(undefined);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (droppedFiles) => {
      const updateUploadingFile = (updatedFile: UploadingFile) => {
        setUploadingFiles((prev) =>
          replaceElement(
            prev,
            generateUploadingFileComparator(updatedFile.localId),
            updatedFile
          )
        );
      };
      // Update the file count first.
      setFileCount(fileCount + droppedFiles.length);
      // Upload each dropped file.
      droppedFiles.forEach((droppedFile) => {
        const localFile = generateLocalFile(droppedFile);
        setUploadingFiles((prev) => addElement(prev, localFile));

        newUpload(commandUrl, localFile, updateUploadingFile)
          .then((uploadResponse: UpdateEntry | UploadFailed) => {
            if (isUpdateEntry(uploadResponse)) {
              const { entry, attachmentDuplicateInfo } = uploadResponse;
              const uploadedFile: UploadedFile = {
                fileEntry: entry,
                status: "uploaded",
              };
              setUploadingFiles((prev) =>
                deleteElement(
                  prev,
                  generateUploadingFileComparator(localFile.localId),
                  1
                )
              );
              setUploadedFiles((prev) => addElement(prev, uploadedFile));
              setShowDuplicateWarning(
                attachmentDuplicateInfo?.displayWarningMessage ?? false
              );
            } else {
              throw new Error(uploadResponse.reason);
            }
          })
          .catch((error: Error) => {
            // There is no more error handling required for cancelling an Axios request.
            // For all other errors, update state to display the error message for the file.
            if (!Axios.isCancel(error)) {
              updateUploadingFile({
                ...localFile,
                status: "failed",
                failedReason: error.message,
              });
            }
          })
          .finally(reloadState);
      });
    },
  });

  /**
   * Update whether to show the attachment duplicate warning.
   * In the first render where 'showDuplicateWarning' is undefined, do nothing
   * because the warning message is controlled by server.
   */
  useEffect(() => {
    if (showDuplicateWarning !== undefined) {
      updateDuplicateMessage(ctrlId, showDuplicateWarning);
    }
  }, [showDuplicateWarning]);

  /**
   * Update the error text for exceeding maximum number of attachments.
   * When there is a limit, check if 'fileCount' is greater than 'maxAttachments'.
   * If yes, depending on whether the limit is 1 or more than 1, use a proper format
   * provided by server to update the error text.
   * If no, set the text to an empty string which will remove the error.
   * Lastly, do nothing when there is no limit.
   */
  useEffect(() => {
    if (maxAttachments) {
      const remainingQuota = fileCount - maxAttachments;
      const getTextFromFormat = () =>
        maxAttachments > 1
          ? buildMaxAttachmentWarning(
              strings.toomany,
              maxAttachments,
              remainingQuota
            )
          : buildMaxAttachmentWarning(strings.toomany_1, remainingQuota);
      const warningText = fileCount > maxAttachments ? getTextFromFormat() : "";

      updateCtrlErrorText(ctrlId, warningText);
    }
  }, [fileCount]);

  const onEdit = (fileId: string) => openDialog("", fileId);

  const onReplace = (fileId: string) => openDialog(fileId, "");

  const onDelete = (fileId: string) => {
    const confirmDelete = window.confirm(strings.deleteConfirm);
    if (confirmDelete) {
      deleteUpload(commandUrl, fileId)
        .then(({ attachmentDuplicateInfo }) => {
          setUploadedFiles(
            deleteElement(
              uploadedFiles,
              generateUploadedFileComparator(fileId),
              1
            )
          );
          setShowDuplicateWarning(
            attachmentDuplicateInfo?.displayWarningMessage ?? false
          );
          setFileCount(fileCount - 1);
        })
        .finally(reloadState);
    }
  };

  const onCancel = (fileId: string) => {
    cancelUpload(fileId);
    setUploadingFiles(
      deleteElement(uploadingFiles, generateUploadingFileComparator(fileId), 1)
    );
    setFileCount(fileCount - 1);
  };

  /**
   * Build three text buttons for UploadedFile or one icon button for UploadingFile.
   */
  const buildActions = (file: UploadedFile | UploadingFile): UploadAction[] =>
    isUploadedFile(file)
      ? [
          {
            onClick: () => onEdit(file.fileEntry.id),
            text: strings.edit,
          },
          {
            onClick: () => onReplace(file.fileEntry.id),
            text: strings.replace,
          },
          {
            onClick: () => onDelete(file.fileEntry.id),
            text: strings.delete,
          },
        ]
      : [
          {
            onClick: () => onCancel(file.localId),
            text: strings.cancel,
            icon: <CancelIcon />,
          },
        ];

  return (
    <Grid
      container
      id={`${ctrlId}universalresources`}
      className="universalresources"
      direction="column"
    >
      <Grid item>
        <UploadList
          files={[...uploadedFiles, ...uploadingFiles]}
          buildActions={buildActions}
          noFileSelectedText={strings.none}
        />
      </Grid>

      {editable && (maxAttachments === null || fileCount < maxAttachments) && (
        <Grid item>
          <IconButton
            id={`${ctrlId}_addLink`}
            onClick={() => openDialog("", "")}
            title={strings.add}
            color="primary"
          >
            <AddCircleIcon />
          </IconButton>
          {canUpload && (
            <div {...getRootProps({ className: "dropzone" })}>
              <input id={`${ctrlId}_fileUpload_file`} {...getInputProps()} />
              <div className="filedrop">{strings.drop}</div>
            </div>
          )}
        </Grid>
      )}
    </Grid>
  );
};
