import * as vscode from 'vscode'
import * as fs from 'fs'
import { SvelteWebviewInitializer } from './svelteWebviewInitializer'
import { DataView, encodeForDisplay, makeAddressRange, makeOffsetRange, logicalDisplay, DisplayState } from './fileUtils'
import { EditorMessage, MessageCommand } from './messageHandler'

/** Data editor message data structure for communication between Webview and VSCode. */


export class WebView implements vscode.Disposable {
  private panel: vscode.WebviewPanel
  private svelteWebviewInitializer: SvelteWebviewInitializer
  private fileToEdit: string = ""
  private fileData: Buffer = Buffer.alloc(0)
  private displayState = new DisplayState()

  constructor(
    protected context: vscode.ExtensionContext,
    private view: string,
    title: string
  ) {
    this.panel = this.createPanel(title)
    this.panel.webview.onDidReceiveMessage(this.messageReceiver, this)

    this.svelteWebviewInitializer = new SvelteWebviewInitializer(context)
    this.svelteWebviewInitializer.initialize(this.view, this.panel.webview)
  }

  dispose(): void {
    this.panel.dispose()
  }

  show(): void {
    this.panel.reveal()
  }

  setTitle(title: string): void {
    this.panel.title = title
  }

  private createPanel(title: string): vscode.WebviewPanel {
    vscode.window
      .showOpenDialog({
      canSelectMany: false,
      openLabel: 'Select',
      canSelectFiles: true,
      canSelectFolders: false,
    })
    .then((fileUri) => {
      if (fileUri && fileUri[0]) {
        this.fileToEdit = fileUri[0].fsPath
      }
      let data = fs.readFileSync(this.fileToEdit);
      this.fileData = Buffer.from(data);
      
      this.displayState.address.end = this.fileData.length / 16;

      this.panel.webview.postMessage({
        command: MessageCommand.loadFile,
        metrics: { 
          type: fs.statSync(this.fileToEdit).mode, 
          size: this.fileData.length, 
          asciiCount: 0 
        },
        display: {
          address: makeAddressRange(this.displayState.address),
          physicalOffset: makeOffsetRange(this.displayState.physicalOffset),
          physical: encodeForDisplay(this.fileData, this.displayState.physicalDisplay),
          logicalOffset: makeOffsetRange(this.displayState.logicalOffset),
          logical: logicalDisplay(this.fileData, this.displayState.logicalDisplay)
        }
      });
    })

    const column =
      vscode.window.activeTextEditor &&
      vscode.window.activeTextEditor.viewColumn
        ? vscode.window.activeTextEditor?.viewColumn
        : vscode.ViewColumn.Active
    return vscode.window.createWebviewPanel(this.view, title, column)
  }

  private messageReceiver(message: EditorMessage) {
    switch( message.command ) {
      case MessageCommand.addressTypeChange:
        this.displayState.updateAddressState(message.data.address);
        this.displayState.updatePhysicalDisplayState(message.data.physicalDisplay);
        this.displayState.updatePhysicalOffsetState(message.data.physicalOffset);
        this.displayState.updateLogicalOffsetState(message.data.logicalOffset);
        this.displayState.updateLogicalDisplayState(message.data.logicalDisplay); 

        this.panel.webview.postMessage({
          command: MessageCommand.addressTypeChange,
          display: {
            address: makeAddressRange(this.displayState.address),
            physicalOffset: makeOffsetRange(this.displayState.physicalOffset),
            physical: encodeForDisplay(this.fileData, this.displayState.physicalDisplay),
            logicalOffset: makeOffsetRange(this.displayState.logicalOffset),
            logical: logicalDisplay(this.fileData, this.displayState.logicalDisplay)
          }
        })
        break;

      case MessageCommand.editorChange:
        this.displayState.updateEditorDisplayState(message.data.editor);
        var data = this.fileData.slice(
          this.displayState.editorDisplay.start, 
          this.displayState.editorDisplay.end).toString(this.displayState.editorDisplay.encoding)

        this.panel.webview.postMessage({
          command: MessageCommand.editorChange,
          display: {
            editor: data,
            dataView: this.populateDataView()
          }
        });
        break;
    }
  }
  private populateDataView(): DataView {
    let pos = this.displayState.editorDisplay.cursor
    let radix = this.displayState.physicalDisplay.radix
    let ret: DataView = {
      int64: this.fileData.readBigInt64LE(pos).toString(radix),
      uint64: this.fileData.readBigUint64LE(pos).toString(radix),
      float64: this.fileData.readFloatLE(pos).toString(radix),
      float32: this.fileData.readFloatLE(pos).toString(radix),
      int32: this.fileData.readInt32LE(pos).toString(radix),
      uint32: this.fileData.readUint32LE(pos).toString(radix),
      int16: this.fileData.readInt16LE(pos).toString(radix),
      uint16: this.fileData.readUint16LE(pos).toString(radix),
      int8: this.fileData.readInt8(pos).toString(radix),
      uint8: this.fileData.readUInt8(pos).toString(radix),
      b8: "",
      b16: "",
      b32: "",
      b64: ""
    }
    return ret
  }
}
