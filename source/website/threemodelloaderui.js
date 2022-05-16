import { AddDiv } from '../engine/viewer/domutils.js';
import { ThreeModelLoader } from '../engine/threejs/threemodelloader.js';
import { ShowMessageDialog } from './dialogs.js';
import { ButtonDialog, ProgressDialog } from './dialog.js';
import { AddSvgIconElement } from './utils.js';
import { ImportErrorCode } from '../engine/import/importer.js';

export class ThreeModelLoaderUI
{
    constructor ()
    {
        this.modelLoader = new ThreeModelLoader ();
        this.modalDialog = null;
    }

    LoadModel (files, fileSource, settings, callbacks)
    {
        if (this.modelLoader.InProgress ()) {
            return;
        }

        let progressDialog = null;
        this.modelLoader.LoadModel (files, fileSource, settings, {
            onLoadStart : () => {
                this.CloseDialogIfOpen ();
                callbacks.onStart ();
                progressDialog = new ProgressDialog ();
                progressDialog.Init ('Loading Model');
                progressDialog.Open ();
            },
            onSelectMainFile : (fileNames, selectFile) => {
                progressDialog.Close ();
                this.modalDialog = this.ShowFileSelectorDialog (fileNames, (index) => {
                    progressDialog.Open ();
                    selectFile (index);
                });
            },
            onImportStart : () => {
                progressDialog.SetText ('Importing Model');
            },
            onVisualizationStart : () => {
                progressDialog.SetText ('Visualizing Model');
            },
            onModelFinished : (importResult, threeObject) => {
                progressDialog.Close ();
                callbacks.onFinish (importResult, threeObject);
            },
            onTextureLoaded : () => {
                callbacks.onRender ();
            },
            onLoadError : (importError) => {
                progressDialog.Close ();
                // callbacks.onError (importError);
                this.modalDialog = this.ShowErrorDialog (importError);
                callbacks.onFinish ({}, {});
            },
        });
    }

    GetModelLoader ()
    {
        return this.modelLoader;
    }

    GetImporter ()
    {
        return this.modelLoader.GetImporter ();
    }

    ShowErrorDialog (importError)
    {
        if (importError.code === ImportErrorCode.NoImportableFile) {
            return ShowMessageDialog (
                '错误',
                '没有可导入的文件.',
                null
            );
        } else if (importError.code === ImportErrorCode.FailedToLoadFile) {
            return ShowMessageDialog (
                '错误',
                '导入文件失败.',
                '远程文件请求失败，请确认地址及服务器权限正确.'
            );
        } else if (importError.code === ImportErrorCode.ImportFailed) {
            return ShowMessageDialog (
                '错误',
                '导入模型失败.',
                importError.message
            );
        } else {
            return ShowMessageDialog (
                '错误',
                '未知错误.',
                null
            );
        }
    }

    ShowFileSelectorDialog (fileNames, onSelect)
    {
        let dialog = new ButtonDialog ();
        let contentDiv = dialog.Init ('Select Model', [
            {
                name : 'Cancel',
                subClass : 'outline',
                onClick () {
                    dialog.Close ();
                }
            }
        ]);
        dialog.SetCloseHandler (() => {
            onSelect (null);
        });

        let text = 'Multiple importable models found. Select the model you would like to import from the list below.';
        AddDiv (contentDiv, 'ov_dialog_message', text);

        let fileListSection = AddDiv (contentDiv, 'ov_dialog_section');
        let fileList = AddDiv (fileListSection, 'ov_dialog_import_file_list ov_thin_scrollbar');

        for (let i = 0; i < fileNames.length; i++) {
            let fileName = fileNames[i];
            let fileLink = AddDiv (fileList, 'ov_dialog_file_link');
            AddSvgIconElement (fileLink, 'meshes', 'ov_file_link_img');
            AddDiv (fileLink, 'ov_dialog_file_link_text', fileName);
            fileLink.addEventListener ('click', () => {
                dialog.SetCloseHandler (null);
                dialog.Close ();
                onSelect (i);
            });
        }

        dialog.Open ();
        return dialog;
    }

    CloseDialogIfOpen ()
    {
        if (this.modalDialog !== null) {
            this.modalDialog.Close ();
            this.modalDialog = null;
        }
    }
}
