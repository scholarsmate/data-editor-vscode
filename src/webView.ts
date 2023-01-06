import * as vscode from 'vscode'
import * as fs from 'fs'
import { SvelteWebviewInitializer } from './svelteWebviewInitializer'
import { encodeForDisplay, makeAddressRange, makeOffsetRange, logicalDisplay, DisplayState } from './fileUtils'
import { EditorMessage, MessageCommand } from './messageHandler'
import { log } from 'util'

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
      case MessageCommand.processSelection:
        vscode.window.showInformationMessage( `Send index [${message.data.start}:${message.data.end}]` )
        let start = message.data.start;
        let end = message.data.end;

        this.panel.webview.postMessage({
          command: MessageCommand.editorSelection,
          content: this.fileData.slice(start, end).toString(message.data.encoding)
        })

        break;
      case MessageCommand.addressTypeChange:
        console.log(message);

        this.displayState.updateAddressState(message.data.address);
        this.displayState.updatePhysicalDisplayState(message.data.physicalDisplay);
        this.displayState.updatePhysicalOffsetState(message.data.physicalOffset);
        this.displayState.updateLogicalOffsetState(message.data.logicalOffset);
        this.displayState.updateLogicalDisplayState(message.data.logicalDisplay);
        console.log(this.displayState);
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
    }
  }
}
