var BABYLON;
(function (BABYLON) {
    var EDITOR;
    (function (EDITOR) {
        var GUITextureEditor = (function () {
            /**
            * Constructor
            * @param core: the editor core
            * @param object: the object to edit
            * @param propertyPath: the path to the texture property of the object
            */
            function GUITextureEditor(core, objectName, object, propertyPath) {
                this._targetTexture = null;
                this._texturesList = null;
                // Initialize
                this._core = core;
                this._core.eventReceivers.push(this);
                this._core.editor.editPanel.close();
                this.object = object;
                this.propertyPath = propertyPath;
                this._objectName = objectName;
                // Initialize object and property path
                if (object && propertyPath) {
                    this._targetObject = object[propertyPath];
                    if (!this._targetObject || !(this._targetObject instanceof BABYLON.BaseTexture)) {
                        this._targetObject = null;
                    }
                }
                // Finish
                this._createUI();
            }
            // On Event
            GUITextureEditor.prototype.onEvent = function (ev) {
                if (ev.eventType === EDITOR.EventType.SCENE_EVENT) {
                    var eventType = ev.sceneEvent.eventType;
                    if (eventType === EDITOR.SceneEventType.OBJECT_ADDED || eventType === EDITOR.SceneEventType.OBJECT_REMOVED) {
                        this._fillTextureList();
                    }
                }
                return false;
            };
            // Creates the UI
            GUITextureEditor.prototype._createUI = function () {
                var _this = this;
                this._core.editor.editPanel.setPanelSize(40);
                // IDs and elements
                var texturesListID = "BABYLON-EDITOR-TEXTURES-EDITOR-TEXTURES";
                var canvasID = "BABYLON-EDITOR-TEXTURES-EDITOR-CANVAS";
                var texturesListElement = EDITOR.GUI.GUIElement.CreateDivElement(texturesListID, "width: 50%; height: 100%; float: left;");
                var canvasElement = EDITOR.GUI.GUIElement.CreateElement("canvas", canvasID, "width: 50%; height: 100%; float: right;");
                this._core.editor.editPanel.addContainer(texturesListElement, texturesListID);
                this._core.editor.editPanel.addContainer(canvasElement, canvasID);
                // Texture canvas
                var engine = new BABYLON.Engine($("#" + canvasID)[0], true);
                var scene = new BABYLON.Scene(engine);
                scene.clearColor = new BABYLON.Color3(0, 0, 0);
                var camera = new BABYLON.Camera("TextureEditorCamera", BABYLON.Vector3.Zero(), scene);
                var postProcess = new BABYLON.PassPostProcess("PostProcessTextureEditor", 1.0, camera);
                postProcess.onApply = function (effect) {
                    if (_this._targetTexture)
                        effect.setTexture("textureSampler", _this._targetTexture);
                };
                engine.runRenderLoop(function () {
                    scene.render();
                });
                // Textures list
                this._texturesList = new EDITOR.GUI.GUIGrid(texturesListID, this._core);
                this._texturesList.header = this._objectName ? this._objectName : "Textures ";
                this._texturesList.createColumn("name", "name", "100%");
                this._texturesList.showSearch = false;
                this._texturesList.showOptions = false;
                this._texturesList.showAdd = true;
                this._texturesList.buildElement(texturesListID);
                this._fillTextureList();
                this._texturesList.onClick = function (selected) {
                    if (selected.length === 0)
                        return;
                    var selectedTexture = _this._core.currentScene.textures[selected[0]];
                    if (selectedTexture.name.toLowerCase().indexOf(".hdr") !== -1)
                        return;
                    var serializationObject = selectedTexture.serialize();
                    if (_this._targetTexture)
                        _this._targetTexture.dispose();
                    if (selectedTexture._buffer) {
                        serializationObject.base64String = selectedTexture._buffer;
                    }
                    else if (EDITOR.FilesInput.FilesTextures[selectedTexture.name]) {
                        serializationObject.name = selectedTexture.url;
                    }
                    else if (selectedTexture.isCube || selectedTexture.isRenderTarget) {
                        return;
                    }
                    _this._targetTexture = BABYLON.Texture.Parse(serializationObject, scene, "");
                    if (_this.object) {
                        _this.object[_this.propertyPath] = selectedTexture;
                    }
                };
                this._texturesList.onAdd = function () {
                    var inputFiles = $("#BABYLON-EDITOR-LOAD-TEXTURE-FILE");
                    inputFiles[0].onchange = function (data) {
                        for (var i = 0; i < data.target.files.length; i++) {
                            BABYLON.Tools.ReadFileAsDataURL(data.target.files[i], _this._onReadFileCallback(data.target.files[i].name), null);
                        }
                    };
                    inputFiles.click();
                };
                this._texturesList.onReload = function () {
                    _this._fillTextureList();
                };
                // Finish
                this._core.editor.editPanel.onClose = function () {
                    _this._texturesList.destroy();
                    scene.dispose();
                    engine.dispose();
                    _this._core.removeEventReceiver(_this);
                };
            };
            // Fills the texture list
            GUITextureEditor.prototype._fillTextureList = function () {
                this._texturesList.clear();
                for (var i = 0; i < this._core.currentScene.textures.length; i++) {
                    this._texturesList.addRow({
                        name: this._core.currentScene.textures[i].name,
                        recid: i
                    });
                }
            };
            // On readed texture file callback
            GUITextureEditor.prototype._onReadFileCallback = function (name) {
                var _this = this;
                return function (data) {
                    var texture = BABYLON.Texture.CreateFromBase64String(data, name, _this._core.currentScene, false, false, BABYLON.Texture.BILINEAR_SAMPLINGMODE);
                    texture.name = texture.name.replace("data:", "");
                    _this._texturesList.addRow({
                        name: name,
                        recid: _this._texturesList.getRowCount() - 1
                    });
                    _this._core.editor.editionTool.isObjectSupported(_this._core.editor.editionTool.object);
                };
            };
            return GUITextureEditor;
        })();
        EDITOR.GUITextureEditor = GUITextureEditor;
    })(EDITOR = BABYLON.EDITOR || (BABYLON.EDITOR = {}));
})(BABYLON || (BABYLON = {}));