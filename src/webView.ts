import * as vscode from 'vscode'
import * as fs from 'fs'
import { SvelteWebviewInitializer } from './svelteWebviewInitializer'
import { logicalDisplay, DisplayState } from './fileUtils'
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
      let data = fs.readFileSync(this.fileToEdit)
      this.fileData = Buffer.from(data);
      let msgData = new Uint8Array(data.toString(this.displayState.editorDisplay.encoding).split('').map((e)=>e.charCodeAt(0)))
      console.log(msgData)

      this.panel.webview.postMessage({
        command: MessageCommand.loadFile,
        metrics: { 
          type: fs.statSync(this.fileToEdit).mode, 
          size: this.fileData.length, 
          asciiCount: 0 },
        editor:   { fileData: msgData },
        display:  { logical: logicalDisplay(this.fileData, this.displayState.logicalDisplay) }        
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
      // case MessageCommand.addressTypeChange:
      //   this.displayState.updateAddressState(message.data.address);
      //   this.displayState.updatePhysicalDisplayState(message.data.physicalDisplay);
      //   this.displayState.updatePhysicalOffsetState(message.data.physicalOffset);
      //   this.displayState.updateLogicalOffsetState(message.data.logicalOffset);
      //   this.displayState.updateLogicalDisplayState(message.data.logicalDisplay); 

      //   this.panel.webview.postMessage({
      //     command: MessageCommand.addressTypeChange,
      //     display: {
      //       address: makeAddressRange(this.displayState.address),
      //       physicalOffset: makeOffsetRange(this.displayState.physicalOffset),
      //       physical: encodeForDisplay(this.fileData, this.displayState.physicalDisplay),
      //       logicalOffset: makeOffsetRange(this.displayState.logicalOffset),
      //       logical: logicalDisplay(this.fileData, this.displayState.logicalDisplay)
      //     }
      //   })
      //   break;

      case MessageCommand.editorOnChange:
        this.displayState.updateEditorDisplayState(message.data.editor);
        
        var bufSlice: string = this.fileData
        .slice(this.displayState.editorDisplay.start, this.displayState.editorDisplay.end)
        .toString(message.data.editor.encoding)
        // var bufSlice: string = Buffer.from(this.fileData, this.displayState.editorDisplay.start, this.displayState.editorDisplay.end)
        // .toString(message.data.editor.encoding)

        console.log(bufSlice)

        this.panel.webview.postMessage({
          command: MessageCommand.editorOnChange,
          display: { editor: bufSlice }
        });
        break;

      // case MessageCommand.editorSelection:
      //   this.displayState.editorDisplay.cursor = message.data.start
      //   console.log(message.data)
      //   this.panel.webview.postMessage({
      //     command: MessageCommand.editorSelection,
      //     display: {
      //       dataView: this.populateDataView()
      //     }
      //   })
      //   break;
    }
  }
  // private populateDataView( start: number = this.displayState.editorDisplay.cursor, 
  //                           end: number = start): DataView {
  //   let radix = this.displayState.editorDisplay.radix
  //   let ret: DataView = {
  //     int64: "",
  //     uint64: "",
  //     float64: "", 
  //     float32: "",
  //     int32: "",
  //     uint32: "",
  //     int16: "",
  //     uint16: "",
  //     int8: this.fileData.readInt8(start).toString(radix),
  //     uint8: this.fileData.readUInt8(start).toString(radix),
  //     b8: "",
  //     b16: "",
  //     b32: "",
  //     b64: ""
  //   }

  //   if( end - start > 0 ) {
  //     ret.int16   = this.fileData.readInt16LE(start).toString(radix)
  //     ret.uint16  = this.fileData.readUInt16LE(start).toString(radix)
  //   }
  //   if( end - start > 2 ) {
  //     ret.int32   = this.fileData.readInt32LE(start).toString(radix)
  //     ret.uint32  = this.fileData.readUInt32LE(start).toString(radix)
  //     ret.float32 = this.fileData.readFloatLE(start).toString(radix)
  //   }
  //   if( end - start > 5 ) {
  //     ret.int64 = this.fileData.readBigInt64LE(start).toString(radix)
  //     ret.uint64 = this.fileData.readBigUInt64LE(start).toString(radix)
  //     ret.float64 = this.fileData.readDoubleLE(start).toString(radix)
  //   }
  //   return ret
  // }
}
