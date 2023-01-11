<script lang="ts">
  const vscode = acquireVsCodeApi();

  enum MessageCommand {
    commit,
    addBreakpoint,
    editorOnSelection,
    editorOnChange,
    loadFile,
    addressTypeChange,
    configUpdate,
  }

  type AddressState = {
    start: number,
    end: number,
    stride: number,
    radix: number
  }
  type PhysicalDisplayState = {
    radix: number,
    bytesPerRow: number
  }
  type LogicalDisplayState = {
    bytesPerRow: number
  }
  type OffsetState = {
    radix: number,
    spread: number
  }
  type EditorDisplayState = {
    encoding: BufferEncoding,
    start: number,
    end: number,
    cursor: number,
    radix: number
  }
  interface EditorControls {
    bytes_per_line: number
    address_numbering: number
    radix: number
    little_endian: boolean
    logical_encoding: string
    offset: number
    length: number
    edit_byte_size: number
    edit_encoding: BufferEncoding
    lsb_higher_offset: boolean
    bytes_per_row: number
    editor_selection_start: number
    editor_selection_end: number
    editor_cursor_pos: number
    goto_offset: number
  }

  interface EditorMetrics {
    change_count: number
    data_breakpoint_count: number
    file_byte_count: number
    ascii_byte_count: number
    row_count: number
  }

  interface EditorElements {
    data_editor: HTMLElement
    address: HTMLTextAreaElement
    physical: HTMLTextAreaElement
    logical: HTMLTextAreaElement
    editor: HTMLTextAreaElement
    physical_offsets: HTMLElement
    logical_offsets: HTMLElement
    selected_offsets: HTMLElement
    editor_offsets: HTMLElement
    data_view_offset: HTMLElement
    commit_button: HTMLInputElement
    add_data_breakpoint_button: HTMLInputElement
    change_count: HTMLElement
    data_breakpoint_count: HTMLElement
    file_byte_count: HTMLElement
    ascii_byte_count: HTMLElement
    file_type: HTMLElement
    file_metrics_vw: HTMLElement
    goto_offset: HTMLInputElement
    radix: HTMLInputElement
    data_vw: HTMLElement
    b8_dv: HTMLElement
    b16_dv: HTMLElement
    b32_dv: HTMLElement
    b64_dv: HTMLElement
    int8_dv: HTMLInputElement
    uint8_dv: HTMLInputElement
    int16_dv: HTMLInputElement
    uint16_dv: HTMLInputElement
    int32_dv: HTMLInputElement
    uint32_dv: HTMLInputElement
    int64_dv: HTMLInputElement
    uint64_dv: HTMLInputElement
    float32_dv: HTMLInputElement
    float64_dv: HTMLInputElement
  }

  interface EditorState {
    file_content: Uint8Array | null
    edit_content: Uint8Array
    editor_controls: EditorControls
    editor_metrics: EditorMetrics
    editor_elements: EditorElements
  }

  let editor_state: EditorState

  function init() {
    editor_state = {
      file_content: null,
      edit_content: new Uint8Array(0),
      editor_elements: {
        data_editor: document.getElementById('data_editor') as HTMLInputElement,
        address: document.getElementById('address') as HTMLTextAreaElement,
        physical: document.getElementById('physical') as HTMLTextAreaElement,
        logical: document.getElementById('logical') as HTMLTextAreaElement,
        editor: document.getElementById('editor') as HTMLTextAreaElement,
        physical_offsets: document.getElementById(
          'physical_offsets'
        ) as HTMLInputElement,
        logical_offsets: document.getElementById(
          'logical_offsets'
        ) as HTMLInputElement,
        selected_offsets: document.getElementById(
          'selected_offsets'
        ) as HTMLElement,
        editor_offsets: document.getElementById(
          'editor_offsets'
        ) as HTMLElement,
        data_view_offset: document.getElementById('offset_dv') as HTMLElement,
        file_byte_count: document.getElementById(
          'file_byte_cnt'
        ) as HTMLElement,
        change_count: document.getElementById('change_cnt') as HTMLElement,
        data_breakpoint_count: document.getElementById(
          'data_breakpoint_cnt'
        ) as HTMLElement,
        file_metrics_vw: document.getElementById(
          'file_metrics_vw'
        ) as HTMLElement,
        ascii_byte_count: document.getElementById(
          'ascii_byte_cnt'
        ) as HTMLElement,
        file_type: document.getElementById('file_type') as HTMLElement,
        commit_button: document.getElementById(
          'commit_btn'
        ) as HTMLInputElement,
        add_data_breakpoint_button: document.getElementById(
          'add_data_breakpoint_btn'
        ) as HTMLInputElement,
        goto_offset: document.getElementById('goto_offset') as HTMLInputElement,
        radix: document.getElementById('radix') as HTMLInputElement,
        data_vw: document.getElementById('data_vw') as HTMLElement,
        b8_dv: document.getElementById('b8_dv') as HTMLElement,
        b16_dv: document.getElementById('b16_dv') as HTMLElement,
        b32_dv: document.getElementById('b32_dv') as HTMLElement,
        b64_dv: document.getElementById('b64_dv') as HTMLElement,
        int8_dv: document.getElementById('int8_dv') as HTMLInputElement,
        uint8_dv: document.getElementById('uint8_dv') as HTMLInputElement,
        int16_dv: document.getElementById('int16_dv') as HTMLInputElement,
        uint16_dv: document.getElementById('uint16_dv') as HTMLInputElement,
        int32_dv: document.getElementById('int32_dv') as HTMLInputElement,
        uint32_dv: document.getElementById('uint32_dv') as HTMLInputElement,
        int64_dv: document.getElementById('int64_dv') as HTMLInputElement,
        uint64_dv: document.getElementById('uint64_dv') as HTMLInputElement,
        float32_dv: document.getElementById('float32_dv') as HTMLInputElement,
        float64_dv: document.getElementById('float64_dv') as HTMLInputElement,
      },
      editor_controls: {
        bytes_per_line: 8,
        address_numbering: 10,
        radix: 16,
        little_endian: true,
        logical_encoding: 'latin1',
        offset: 0,
        length: 0,
        edit_byte_size: 8,
        edit_encoding: 'latin1',
        lsb_higher_offset: true,
        bytes_per_row: 16,
        editor_selection_start: 0,
        editor_selection_end: 0,
        editor_cursor_pos: 0,
        goto_offset: 0,
      },
      editor_metrics: {
        change_count: 0,
        data_breakpoint_count: 0,
        file_byte_count: 0,
        ascii_byte_count: 0,
        row_count: 0,
      },
    }
    // add listeners
    editor_state.editor_elements.physical.addEventListener('select', () =>
      handleSelected(
        frameSelectedOnWhitespace(editor_state.editor_elements.physical)
      )
    )
    editor_state.editor_elements.logical.addEventListener('select', () =>
      handleSelected(frameSelected(editor_state.editor_elements.logical))
    )
    editor_state.editor_elements.radix.addEventListener('change', () => {
      editor_state.editor_controls.radix = parseInt(
        editor_state.editor_elements.radix.value
      )
      updateDataView()
    })
    editor_state.editor_elements.int8_dv.addEventListener('change', () => {
      new DataView(editor_state.edit_content.buffer).setInt8(
        editor_state.editor_controls.editor_cursor_pos,
        editor_state.editor_elements.int8_dv.valueAsNumber
      )
      updateDataView()
      refreshEditor()
    })
    editor_state.editor_elements.uint8_dv.addEventListener('change', () => {
      new DataView(editor_state.edit_content.buffer).setUint8(
        editor_state.editor_controls.editor_cursor_pos,
        editor_state.editor_elements.uint8_dv.valueAsNumber
      )
      updateDataView()
      refreshEditor()
    })
    editor_state.editor_elements.int16_dv.addEventListener('change', () => {
      new DataView(editor_state.edit_content.buffer).setInt16(
        editor_state.editor_controls.editor_cursor_pos,
        editor_state.editor_elements.int16_dv.valueAsNumber,
        editor_state.editor_controls.little_endian
      )
      updateDataView()
      refreshEditor()
    })
    editor_state.editor_elements.uint16_dv.addEventListener('change', () => {
      new DataView(editor_state.edit_content.buffer).setUint16(
        editor_state.editor_controls.editor_cursor_pos,
        editor_state.editor_elements.uint16_dv.valueAsNumber,
        editor_state.editor_controls.little_endian
      )
      updateDataView()
      refreshEditor()
    })
    editor_state.editor_elements.int32_dv.addEventListener('change', () => {
      new DataView(editor_state.edit_content.buffer).setInt32(
        editor_state.editor_controls.editor_cursor_pos,
        editor_state.editor_elements.int32_dv.valueAsNumber,
        editor_state.editor_controls.little_endian
      )
      updateDataView()
      refreshEditor()
    })
    editor_state.editor_elements.uint32_dv.addEventListener('change', () => {
      new DataView(editor_state.edit_content.buffer).setUint32(
        editor_state.editor_controls.editor_cursor_pos,
        editor_state.editor_elements.uint32_dv.valueAsNumber,
        editor_state.editor_controls.little_endian
      )
      updateDataView()
      refreshEditor()
    })
    editor_state.editor_elements.int64_dv.addEventListener('change', () => {
      new DataView(editor_state.edit_content.buffer).setBigInt64(
        editor_state.editor_controls.editor_cursor_pos,
        BigInt(editor_state.editor_elements.int64_dv.value),
        editor_state.editor_controls.little_endian
      )
      updateDataView()
      refreshEditor()
    })
    editor_state.editor_elements.uint64_dv.addEventListener('change', () => {
      new DataView(editor_state.edit_content.buffer).setBigUint64(
        editor_state.editor_controls.editor_cursor_pos,
        BigInt(editor_state.editor_elements.uint32_dv.value),
        editor_state.editor_controls.little_endian
      )
      updateDataView()
      refreshEditor()
    })
    editor_state.editor_elements.float32_dv.addEventListener('change', () => {
      new DataView(editor_state.edit_content.buffer).setFloat32(
        editor_state.editor_controls.editor_cursor_pos,
        editor_state.editor_elements.float32_dv.valueAsNumber,
        editor_state.editor_controls.little_endian
      )
      updateDataView()
      refreshEditor()
    })
    editor_state.editor_elements.float64_dv.addEventListener('change', () => {
      new DataView(editor_state.edit_content.buffer).setFloat64(
        editor_state.editor_controls.editor_cursor_pos,
        editor_state.editor_elements.float64_dv.valueAsNumber,
        editor_state.editor_controls.little_endian
      )
      updateDataView()
      refreshEditor()
    })
    editor_state.editor_elements.commit_button.addEventListener('click', () => {
      vscode.postMessage({command: "commit", data: "testdata"});
    })
    editor_state.editor_elements.add_data_breakpoint_button.addEventListener('click', () => {
      vscode.postMessage({command: "set_break", data: "testdata"});
    })
    
    const advanced_mode = document.getElementById(
      'advanced_mode'
    ) as HTMLInputElement
    advanced_mode.addEventListener('change', () =>
      enableAdvanced(advanced_mode.checked)
    )
    const address_type = document.getElementById(
      'address_numbering'
    ) as HTMLInputElement
    address_type.addEventListener('change', () =>
      selectAddressType(parseInt(address_type.value))
    )
    const edit_encoding = document.getElementById(
      'edit_encoding'
    ) as HTMLInputElement
    editor_state.editor_controls.edit_encoding =
      edit_encoding.value as BufferEncoding
    edit_encoding.addEventListener('change', () =>
      selectEditEncoding(edit_encoding.value)
    )
    const endianness = document.getElementById('endianness') as HTMLInputElement
    endianness.addEventListener('change', () =>
      selectEndianness(endianness.value)
    )
    editor_state.editor_elements.goto_offset.addEventListener('change', () => {
      editor_state.editor_controls.goto_offset = parseInt(
        editor_state.editor_elements.goto_offset.value
      )
      /* number of pixels per line */
      const line_height =
        editor_state.editor_elements.physical.scrollHeight /
        editor_state.editor_metrics.row_count
      /* number of lines to scroll */
      const line =
        Math.ceil(
          editor_state.editor_controls.goto_offset /
            editor_state.editor_controls.bytes_per_row
        ) - 1
      editor_state.editor_elements.physical.scrollTop = line * line_height
    })
    editor_state.editor_elements.editor.addEventListener('change', ()=>{
      let commitMsg = {
        offset: editor_state.editor_controls.offset,
        length: 0,
        data: null
      }

      switch(editor_state.editor_controls.edit_encoding){
        case 'hex':
          commitMsg.length = editor_state.editor_elements.editor.value.length / 2

          // Disable commit button if length is not divisible by a byte.
          editor_state.editor_elements.commit_button.disabled = (commitMsg.length % 2 === 0)
        break;
        default:
          commitMsg.length = editor_state.editor_elements.editor.value.length
      }
      document.getElementById('test').innerHTML = "<h2>Info</h2><br><div>Length: " + commitMsg.length +"</div></br><div>Data: <br>"+editor_state.editor_elements.editor.value + "</div>"

      // vscode.postMessage({
      //   command: MessageCommand.commit,
      //   data: {

      //   }
      // })
    })
    // Track the cursor position
    editor_state.editor_elements.editor.oninput =
      editor_state.editor_elements.editor.onclick =
      editor_state.editor_elements.editor.oncontextmenu =
        storeCursorPos
    editor_state.editor_elements.editor.onkeyup = ({ key }) => {
      if (
        ['Arrow', 'Page', 'Home', 'End'].some((type) => key.startsWith(type))
      ) {
        storeCursorPos()
      }
      else if (['Backspace', "Delete"].some((type)=> key.startsWith(type))){
        editor_state.editor_controls.length--     
        editor_state.editor_elements.selected_offsets.innerHTML =
          'Selection: ' +
          editor_state.editor_controls.editor_selection_start +
          ' - ' +
          (editor_state.editor_controls.editor_selection_start + editor_state.editor_controls.length )  +
          ', length: ' +
          editor_state.editor_controls.length
        document.getElementById('test').innerHTML = "Removed data at: " + editor_state.editor_controls.editor_cursor_pos.toString()
        storeCursorPos()
      }
    }
    // Lock the address, physical and logical views scrollbars together
    let currentScrollEvt: string | null, scrollSyncTimer: NodeJS.Timeout
    editor_state.editor_elements.physical.onscroll = () => {
      if (!currentScrollEvt || currentScrollEvt === 'physical') {
        clearTimeout(scrollSyncTimer)
        currentScrollEvt = 'physical'
        syncScroll(
          editor_state.editor_elements.physical,
          editor_state.editor_elements.address
        )
        syncScroll(
          editor_state.editor_elements.physical,
          editor_state.editor_elements.logical
        )
        scrollSyncTimer = setTimeout(function () {
          currentScrollEvt = null
        }, 100)
      }
    }
    editor_state.editor_elements.address.onscroll = () => {
      if (!currentScrollEvt || currentScrollEvt === 'address') {
        clearTimeout(scrollSyncTimer)
        currentScrollEvt = 'address'
        syncScroll(
          editor_state.editor_elements.address,
          editor_state.editor_elements.physical
        )
        syncScroll(
          editor_state.editor_elements.address,
          editor_state.editor_elements.logical
        )
        scrollSyncTimer = setTimeout(function () {
          currentScrollEvt = null
        }, 100)
      }
    }
    editor_state.editor_elements.logical.onscroll = () => {
      if (!currentScrollEvt || currentScrollEvt === 'logical') {
        clearTimeout(scrollSyncTimer)
        currentScrollEvt = 'logical'
        syncScroll(
          editor_state.editor_elements.logical,
          editor_state.editor_elements.address
        )
        syncScroll(
          editor_state.editor_elements.logical,
          editor_state.editor_elements.physical
        )
        scrollSyncTimer = setTimeout(function () {
          currentScrollEvt = null
        }, 100)
      }
    }
  }

  function storeCursorPos() {
    editor_state.editor_controls.editor_cursor_pos =
      editor_state.editor_elements.editor.selectionStart 
    editor_state.editor_controls.editor_selection_start =
      editor_state.editor_elements.editor.selectionStart
    editor_state.editor_controls.editor_selection_end =
      editor_state.editor_elements.editor.selectionEnd
    editor_state.editor_elements.editor_offsets.innerHTML =
      editor_state.editor_controls.editor_selection_start ===
      editor_state.editor_controls.editor_selection_end
        ? 'cursor: ' + String(editor_state.editor_controls.editor_cursor_pos)
        : 'start: ' +
          String(editor_state.editor_controls.editor_selection_start) +
          ', end: ' +
          String(editor_state.editor_controls.editor_selection_end) +
          ', cursor: ' +
          String(editor_state.editor_controls.editor_cursor_pos)

    // let editorMsg: EditorDisplayState = {
    //   start: editor_state.editor_controls.offset,
    //   end: editor_state.editor_controls.offset +(-editor_state.editor_controls.length),
    //   cursor: editor_state.editor_controls.editor_cursor_pos,
    //   encoding: editor_state.editor_controls.edit_encoding,
    //   radix: parseInt(editor_state.editor_elements.radix.value)
    // }
    // vscode.postMessage({
    //   command: MessageCommand.editorOnSelection,
    //   data: {
    //     start: editor_state.editor_elements.editor.selectionStart,
    //     end: editor_state.editor_elements.editor.selectionEnd,
    //     offset: editor_state.editor_controls.offset
    //   }
    // })

    // console.log(editorMsg)
    // vscode.postMessage({
    //   command: MessageCommand.editorChange,
    //   data: { editor: editorMsg }
    // })
  }

  function selectEndianness(endianness: string) {
    editor_state.editor_controls.little_endian = endianness == 'le'
    updateDataView()
    editor_state.editor_elements.editor.focus()
    editor_state.editor_elements.editor.setSelectionRange(
      editor_state.editor_controls.editor_selection_start,
      editor_state.editor_controls.editor_selection_end
    )
  }

  async function loadContent(fileData: Uint8Array) {
    editor_state.editor_elements.editor.value = ''
    editor_state.editor_metrics.file_byte_count = fileData.length
    editor_state.editor_controls.goto_offset = 0
    editor_state.editor_elements.goto_offset.max = String(
      fileData.length
    )
    editor_state.editor_elements.goto_offset.value = '0'
    editor_state.editor_elements.logical_offsets.innerHTML = makeOffsetRange(
      10,
      1
    )
    editor_state.editor_elements.physical_offsets.innerHTML = makeOffsetRange(
      10,
      2
    )
    editor_state.editor_elements.address.innerHTML = makeAddressRange(
      0,
      Math.ceil(fileData.length / 16),
      16,
      editor_state.editor_controls.address_numbering
    )
    editor_state.editor_elements.file_byte_count.innerHTML = String(
      editor_state.editor_metrics.file_byte_count
    )
    editor_state.editor_elements.logical.innerHTML = 'Loading...'
    editor_state.file_content = fileData
    editor_state.editor_metrics.ascii_byte_count = countAscii(
      editor_state.file_content
    )
    editor_state.editor_elements.ascii_byte_count.innerHTML = String(
      editor_state.editor_metrics.ascii_byte_count
    )
    editor_state.editor_metrics.row_count = Math.ceil(
      editor_state.file_content.length / editor_state.editor_controls.bytes_per_row
    )
    editor_state.editor_elements.file_metrics_vw.hidden = false
    editor_state.editor_elements.physical.innerHTML = encodeForDisplay(
      editor_state.file_content,
      editor_state.editor_controls.radix,
      editor_state.editor_controls.bytes_per_row
    )
    editor_state.editor_elements.commit_button.disabled = false
    editor_state.editor_elements.add_data_breakpoint_button.disabled = false
  }

  function syncScroll(from: HTMLElement, to: HTMLElement) {
    // Scroll the "to" by the same percentage as the "from"
    const sf = from.scrollHeight - from.clientHeight
    if (sf >= 1) {
      const st = to.scrollHeight - to.clientHeight
      to.scrollTop = (st / 100) * ((from.scrollTop / sf) * 100)
    }
  }

  function refreshEditor() {
    try {
      editor_state.editor_elements.editor.value = Buffer.from(
        editor_state.edit_content
      ).toString(editor_state.editor_controls.edit_encoding)
    } catch (e) {
      console.error(
        'decoding into ' +
          editor_state.editor_controls.edit_encoding +
          ' failed: ' +
          e
      )
      editor_state.editor_elements.editor.value = new TextDecoder().decode(
        editor_state.edit_content
      )
    }
    console.log(
      'compare: ' +
        Buffer.compare(
          Buffer.from(
            editor_state.editor_elements.editor.value,
            editor_state.editor_controls.edit_encoding
          ),
          new Uint8Array(editor_state.edit_content)
        )
    )
  }

  function selectEditEncoding(editEncoding: string) {
    editor_state.editor_controls.edit_encoding = editEncoding as BufferEncoding
    editor_state.editor_elements.editor.selectionStart =
      editor_state.editor_elements.editor.selectionEnd = 0
    storeCursorPos()

    let editorMsg: EditorDisplayState = {
      start: editor_state.editor_controls.offset,
      end: editor_state.editor_controls.offset +(-editor_state.editor_controls.length),
      cursor: editor_state.editor_controls.editor_cursor_pos,
      encoding: editor_state.editor_controls.edit_encoding,
      radix: editor_state.editor_controls.radix
    }
    console.log(editorMsg)
    vscode.postMessage({
      command: MessageCommand.editorOnChange,
      data: { editor: editorMsg }
    })

    editor_state.editor_elements.editor.focus()
  }

  function selectAddressType(addressType: number) {
    var addressState: AddressState;
    var physicalOffsetState: OffsetState;
    var physicalDisplayState: PhysicalDisplayState;
    var logicalOffsetState: OffsetState;
    var logicalDisplayState: LogicalDisplayState;

    editor_state.editor_controls.address_numbering = addressType
    if (
      editor_state.editor_controls.address_numbering === 2 &&
      !editor_state.editor_elements.data_editor.classList.contains('binary')
    ) {
      editor_state.editor_controls.radix = 2
      editor_state.editor_controls.bytes_per_row = 8
      editor_state.editor_elements.data_editor.classList.add('binary')
      addressState = {
        start: 0,
        end: parseInt(editor_state.editor_elements.file_byte_count.innerHTML) / editor_state.editor_controls.bytes_per_row ,
        stride: 8,
        radix: 10
      }
      physicalOffsetState = {
        radix: editor_state.editor_controls.address_numbering,
        spread: 1
      }
      physicalDisplayState = {
        radix: editor_state.editor_controls.address_numbering,
        bytesPerRow: editor_state.editor_controls.bytes_per_row 
      }
      logicalOffsetState = { 
        radix: editor_state.editor_controls.radix * -1,
        spread: 1
      }
      logicalDisplayState = {
        bytesPerRow: 8
      }

    } else {
      editor_state.editor_controls.bytes_per_row = 16
      if (
        editor_state.editor_elements.data_editor.classList.contains('binary')
      ) {
        editor_state.editor_elements.data_editor.classList.remove('binary')
      }
      addressState = {
        start: 0,
        end: parseInt(editor_state.editor_elements.file_byte_count.innerHTML) / editor_state.editor_controls.bytes_per_row ,
        stride: 16,
        radix: editor_state.editor_controls.address_numbering
      }
      physicalOffsetState = {
        radix: editor_state.editor_controls.address_numbering,
        spread: 2
      }
      physicalDisplayState = {
        radix: 16,
        bytesPerRow: editor_state.editor_controls.bytes_per_row 
      }
      logicalOffsetState = { 
        radix: editor_state.editor_controls.address_numbering,
        spread: 1
      }
      logicalDisplayState = {
        bytesPerRow: 16
      }
    }

    vscode.postMessage({
      command: MessageCommand.addressTypeChange,
      data: {
        address: addressState,
        physicalOffset: physicalOffsetState,
        physicalDisplay: physicalDisplayState,
        logicalOffset: logicalOffsetState,
        logicalDisplay: logicalDisplayState
      }
    })
  }

  function updateDataView() {
    const offset = editor_state.editor_controls.editor_cursor_pos
    const data_view = new DataView(editor_state.edit_content.buffer)
    const little_endian = editor_state.editor_controls.little_endian
    const radix = editor_state.editor_controls.radix
    const look_ahead = data_view.byteLength - offset
    editor_state.editor_elements.data_view_offset.innerHTML = String(
      editor_state.editor_controls.offset +
        offset +
        ', encoding: ' +
        String(radix)
    )
    if (look_ahead >= 8) {
      editor_state.editor_elements.int64_dv.value = data_view
        .getBigInt64(offset, little_endian)
        .toString(radix)
      editor_state.editor_elements.uint64_dv.value = data_view
        .getBigUint64(offset, little_endian)
        .toString(radix)
      editor_state.editor_elements.float64_dv.value = data_view
        .getFloat64(offset, little_endian)
        .toString(radix)
      editor_state.editor_elements.int32_dv.value = data_view
        .getInt32(offset, little_endian)
        .toString(radix)
      editor_state.editor_elements.uint32_dv.value = data_view
        .getUint32(offset, little_endian)
        .toString(radix)
      editor_state.editor_elements.float32_dv.value = data_view
        .getFloat32(offset, little_endian)
        .toString(radix)
      editor_state.editor_elements.int16_dv.value = data_view
        .getInt16(offset, little_endian)
        .toString(radix)
      editor_state.editor_elements.uint16_dv.value = data_view
        .getUint16(offset, little_endian)
        .toString(radix)
      editor_state.editor_elements.int8_dv.value = data_view
        .getInt8(offset)
        .toString(radix)
      editor_state.editor_elements.uint8_dv.value = data_view
        .getUint8(offset)
        .toString(radix)
      editor_state.editor_elements.b8_dv.hidden = false
      editor_state.editor_elements.b16_dv.hidden = false
      editor_state.editor_elements.b32_dv.hidden = false
      editor_state.editor_elements.b64_dv.hidden = false
    } else {
      editor_state.editor_elements.b64_dv.hidden = true
      editor_state.editor_elements.int64_dv.value = ''
      editor_state.editor_elements.uint64_dv.value = ''
      editor_state.editor_elements.float64_dv.value = ''
      if (look_ahead >= 4) {
        editor_state.editor_elements.int32_dv.value = data_view
          .getInt32(offset, little_endian)
          .toString(radix)
        editor_state.editor_elements.uint32_dv.value = data_view
          .getUint32(offset, little_endian)
          .toString(radix)
        editor_state.editor_elements.float32_dv.value = data_view
          .getFloat32(offset, little_endian)
          .toString(radix)
        editor_state.editor_elements.int16_dv.value = data_view
          .getInt16(offset, little_endian)
          .toString(radix)
        editor_state.editor_elements.uint16_dv.value = data_view
          .getUint16(offset, little_endian)
          .toString(radix)
        editor_state.editor_elements.int8_dv.value = data_view
          .getInt8(offset)
          .toString(radix)
        editor_state.editor_elements.uint8_dv.value = data_view
          .getUint8(offset)
          .toString(radix)
        editor_state.editor_elements.b8_dv.hidden = false
        editor_state.editor_elements.b16_dv.hidden = false
        editor_state.editor_elements.b32_dv.hidden = false
      } else {
        editor_state.editor_elements.b64_dv.hidden = true
        editor_state.editor_elements.b32_dv.hidden = true
        editor_state.editor_elements.int32_dv.value = ''
        editor_state.editor_elements.uint32_dv.value = ''
        editor_state.editor_elements.float32_dv.value = ''
        if (look_ahead >= 2) {
          editor_state.editor_elements.int16_dv.value = data_view
            .getInt16(offset, little_endian)
            .toString(radix)
          editor_state.editor_elements.uint16_dv.value = data_view
            .getUint16(offset, little_endian)
            .toString(radix)
          editor_state.editor_elements.int8_dv.value = data_view
            .getInt8(offset)
            .toString(radix)
          editor_state.editor_elements.uint8_dv.value = data_view
            .getUint8(offset)
            .toString(radix)
          editor_state.editor_elements.b8_dv.hidden = false
          editor_state.editor_elements.b16_dv.hidden = false
        } else {
          editor_state.editor_elements.b64_dv.hidden = true
          editor_state.editor_elements.b32_dv.hidden = true
          editor_state.editor_elements.b16_dv.hidden = true
          editor_state.editor_elements.int16_dv.value = ''
          editor_state.editor_elements.uint16_dv.value = ''
          if (look_ahead >= 1) {
            editor_state.editor_elements.int8_dv.value = data_view
              .getInt8(offset)
              .toString(radix)
            editor_state.editor_elements.uint8_dv.value = data_view
              .getUint8(offset)
              .toString(radix)
            editor_state.editor_elements.b8_dv.hidden = false
          } else {
            editor_state.editor_elements.b64_dv.hidden = true
            editor_state.editor_elements.b32_dv.hidden = true
            editor_state.editor_elements.b16_dv.hidden = true
            editor_state.editor_elements.b8_dv.hidden = true
            editor_state.editor_elements.int8_dv.value = ''
            editor_state.editor_elements.uint8_dv.value = ''
          }
        }
      }
    }
  }

  function handleSelected(selected: HTMLTextAreaElement) {
    let selectionStart = selected.selectionStart as number
    let selectionEnd = selected.selectionEnd as number

    if (selected.id === 'physical') {
      if (editor_state.editor_controls.radix === 2) {
        selectionStart = selectionStart / 9
        selectionEnd = (selectionEnd - 8) / 9 + 1
      } else {
        selectionStart = selectionStart / 3
        selectionEnd = (selectionEnd - 2) / 3 + 1
      }
    } else {
      selectionStart = selectionStart / 2
      selectionEnd = (selectionEnd + 1) / 2
    }
    editor_state.editor_elements.data_vw.hidden = false
    editor_state.editor_controls.editor_cursor_pos = 0
    editor_state.editor_controls.offset = selectionStart
    editor_state.editor_controls.length = selectionStart - selectionEnd
    editor_state.edit_content = editor_state.file_content!.slice(
      selectionStart,
      selectionEnd
    )
    editor_state.editor_elements.editor.scrollTo(0, 0)
    editor_state.editor_elements.selected_offsets.innerHTML =
      selected.id +
      ': ' +
      selectionStart +
      ' - ' +
      selectionEnd +
      ', length: ' +
      (selectionEnd - selectionStart)
    editor_state.editor_elements.data_view_offset.innerHTML =
      String(selectionStart)
    editor_state.editor_elements.editor_offsets.innerHTML = '-'

    let editorMsg: EditorDisplayState = {
      start: selectionStart,
      end: selectionEnd,
      encoding: editor_state.editor_controls.edit_encoding,
      cursor: editor_state.editor_controls.editor_cursor_pos,
      radix: parseInt(editor_state.editor_elements.radix.value)
    }

    console.log(editorMsg)
    vscode.postMessage({
      command: MessageCommand.editorOnChange,
      data: { editor: editorMsg }
    });

    editor_state.editor_elements.editor.scrollTo(
      0,
      editor_state.editor_elements.editor.scrollHeight
    )

    updateDataView()
    // let selectionStart = selected.selectionStart as number
    // let selectionEnd = selected.selectionEnd as number

    // if (selected.id === 'physical') {
    //   if (editor_state.editor_controls.radix === 2) {
    //     selectionStart = selectionStart / 9
    //     selectionEnd = (selectionEnd - 8) / 9 + 1
    //   } else {
    //     selectionStart = selectionStart / 3
    //     selectionEnd = (selectionEnd - 2) / 3 + 1
    //   }
    // } else {
    //   selectionStart = selectionStart / 2
    //   selectionEnd = (selectionEnd + 1) / 2
    // }
    // editor_state.editor_elements.data_vw.hidden = false
    // editor_state.editor_elements.commit_button.hidden = false
    // editor_state.editor_elements.add_data_breakpoint_button.hidden = false
    // editor_state.editor_controls.editor_cursor_pos = 0
    // editor_state.editor_controls.offset = selectionStart
    // editor_state.editor_controls.length = selectionStart - selectionEnd
    // editor_state.editor_elements.editor.scrollTo(0, 0)
    // editor_state.editor_elements.selected_offsets.innerHTML =
    //   selected.id +
    //   ': ' +
    //   selectionStart +
    //   ' - ' +
    //   selectionEnd +
    //   ', length: ' +
    //   (selectionEnd - selectionStart)
    // editor_state.editor_elements.data_view_offset.innerHTML =
    //   String(selectionStart)
    // editor_state.editor_elements.editor_offsets.innerHTML = '-'

    // let editorMsg: EditorDisplayState = {
    //   start: selectionStart,
    //   end: selectionEnd,
    //   encoding: editor_state.editor_controls.edit_encoding,
    //   cursor: editor_state.editor_controls.editor_cursor_pos,
    //   radix: parseInt(editor_state.editor_elements.radix.value)
    // }
    // console.log(editorMsg)
    // vscode.postMessage({
    //   command: MessageCommand.editorChange,
    //   data: { editor: editorMsg }
    // });

    // editor_state.editor_elements.editor.scrollTo(
    //   0,
    //   editor_state.editor_elements.editor.scrollHeight
    // )
  }

  function frameSelected(selected: HTMLTextAreaElement) {
    let selectionStart = selected.selectionStart as number
    let selectionEnd = selected.selectionEnd as number
    if (selectionStart % 2 === 1) {
      ++selectionStart
    }
    if (selectionEnd % 2 === 0) {
      --selectionEnd
    }
    selected.selectionStart = selectionStart
    selected.selectionEnd = selectionEnd
    return selected
  }

  function frameSelectedOnWhitespace(selected: HTMLTextAreaElement) {
    let selectionStart = selected.selectionStart
    let selectionEnd = selected.selectionEnd

    // Adjust the start to align with the closest beginning of content
    if (selectionStart != undefined && selectionEnd != undefined) {
      if (isWhitespace(selected.value.at(selectionStart))) {
        ++selectionStart
      } else {
        while (
          selectionStart &&
          !isWhitespace(selected.value.at(selectionStart - 1))
        ) {
          --selectionStart
        }
      }
      selected.selectionStart = selectionStart

      // Adjust the end to align with the closest ending of content
      if (isWhitespace(selected.value.at(selectionEnd))) {
        --selectionEnd
      } else {
        while (
          selectionEnd < selected.value.length &&
          !isWhitespace(selected.value.at(selectionEnd + 1))
        ) {
          ++selectionEnd
        }
      }
      selected.selectionEnd =
        selectionEnd < selected.value.length ? selectionEnd + 1 : selectionEnd
    }

    return selected
  }

  function isWhitespace(c: string | undefined): boolean {
    return c ? ' \t\n\r\v'.indexOf(c) > -1 : false
  }

  function countAscii(buf: ArrayBuffer): number {
    return new Uint8Array(buf).reduce((a, b) => a + (b < 128 ? 1 : 0), 0)
  }

  // // determine if the given character is undefined for latin-1 (ref: https://en.wikipedia.org/wiki/ISO/IEC_8859-1)
  function latin1Undefined(c: string): boolean {
    const char_code = c.charCodeAt(0)
    return char_code < 32 || (char_code > 126 && char_code < 160)
  }

  // function logicalDisplay(bytes: ArrayBuffer, bytes_per_row: number): string {
  //   const undefinedCharStandIn = '�'
  //   let result = ''
  //   if (bytes.byteLength > 0) {
  //     const data = Buffer.from(bytes).toString('latin1').replaceAll('\n', ' ')
  //     let i = 0
  //     while (true) {
  //       for (let col = 0; i < data.length && col < bytes_per_row; ++col) {
  //         const c = data.charAt(i++)
  //         result += (latin1Undefined(c) ? undefinedCharStandIn : c) + ' '
  //       }
  //       result = result.slice(0, result.length - 1)
  //       if (i === data.length) {
  //         break
  //       }
  //       result += '\n'
  //     }
  //   }
  //   return result
  // }

  function radixBytePad(radix: number): number {
    switch (radix) {
      case 2:
        return 8
      case 8:
        return 3
      case 10:
        return 3
      case 16:
        return 2
    }
    return 0
  }

  function encodeForDisplay(
    arr: Uint8Array,
    radix: number,
    bytes_per_row: number
  ): string {
    let result = ''
    if (arr.byteLength > 0) {
      const pad = radixBytePad(radix)
      let i = 0
      while (true) {
        for (let col = 0; i < arr.byteLength && col < bytes_per_row; ++col) {
          result += arr[i++].toString(radix).padStart(pad, '0') + ' '
        }
        result = result.slice(0, result.length - 1)
        if (i === arr.byteLength) {
          break
        }
        result += '\n'
      }
    }
    return result
  }

  function makeAddressRange(
    start: number,
    end: number,
    stride: number,
    radix: number
  ): string {
    let i = start
    let result = (i * stride).toString(radix)
    for (++i; i < end; ++i) {
      result += '\n' + (i * stride).toString(radix)
    }
    return result
  }

  function makeOffsetRange(radix: number, spread: number): string {
    return ((radix_: number): string => {
      switch (radix_) {
        // @formatter:off
        case 16:
          return (
            '0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0  <br/>' +
            '0 1 2 3 4 5 6 7 8 9 A B C D E F'
          )
        case 10:
          return (
            '0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1  <br/>' +
            '0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5'
          )
        case 8:
          return (
            '0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1  <br/>' +
            '0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7'
          )
        case 2:
          return (
            '00000000 00111111 11112222 22222233 33333333 44444444 44555555 55556666<br/>' +
            '01234567 89012345 67890123 45678901 23456789 01234567 89012345 67890123'
          )
        case -2:
          return '0 0 0 0 0 0 0 0 <br>' + '0 1 2 3 4 5 6 7'
        // @formatter:on
      }
      return 'unhandled radix'
    })(radix).replaceAll(' ', '&nbsp;'.repeat(spread))
  }

  function enableAdvanced(enable: boolean) {
    const advanced_elements = document.getElementsByClassName('advanced')
    for (let i = 0; i < advanced_elements.length; ++i) {
      const el = advanced_elements[i] as HTMLElement
      el.hidden = !enable
    }
  }

  window.addEventListener('message', (msg) => {
    switch( msg.data.command ) {
      case MessageCommand.loadFile:
        loadContent(msg.data.editor.fileData)
        editor_state.editor_elements.logical.innerHTML = msg.data.display.logical
        break;
      case MessageCommand.editorOnChange:
        editor_state.editor_elements.editor.value = msg.data.display.editor;
        break;
      case MessageCommand.addressTypeChange:
        editor_state.editor_elements.address.innerHTML = msg.data.display.address;
        editor_state.editor_elements.physical_offsets.innerHTML = msg.data.display.physicalOffset;
        editor_state.editor_elements.physical.innerHTML = msg.data.display.physical;
        editor_state.editor_elements.logical_offsets.innerHTML = msg.data.display.logicalOffset;
        editor_state.editor_elements.logical.innerHTML = msg.data.display.logical;
        break;
      case MessageCommand.editorOnSelection:
        console.log(msg.data)
        editor_state.editor_elements.int64_dv.value = msg.data.display.dataView.int64
        editor_state.editor_elements.uint64_dv.value = msg.data.display.dataView.uint64
        editor_state.editor_elements.float64_dv.value = msg.data.display.dataView.float64
        editor_state.editor_elements.int32_dv.value = msg.data.display.dataView.int32
        editor_state.editor_elements.uint32_dv.value = msg.data.display.dataView.uint32
        editor_state.editor_elements.float32_dv.value = msg.data.display.dataView.float32
        editor_state.editor_elements.int16_dv.value = msg.data.display.dataView.int16
        editor_state.editor_elements.uint16_dv.value = msg.data.display.dataView.uint16
        editor_state.editor_elements.int8_dv.value = msg.data.display.dataView.int8
        editor_state.editor_elements.uint8_dv.value = msg.data.display.dataView.uint8
        editor_state.editor_elements.b8_dv.hidden = false
        editor_state.editor_elements.b16_dv.hidden = false
        editor_state.editor_elements.b32_dv.hidden = false
        editor_state.editor_elements.b64_dv.hidden = false
        break;
    }
  })

  window.onload = () => {
    init();
  }

</script>

<header>
  <fieldset class="box">
    <legend>File Metrics</legend>
    <div id="file_metrics_vw">
      <hr />
      Type:<span id="file_type"> -</span>
      <br />Size: <span id="file_byte_cnt"> 0</span>
      <br />ASCII count: <span id="ascii_byte_cnt"> 0</span>
    </div>
  </fieldset>
  <fieldset class="box">
    <legend>offset</legend>
    <div class="goto_offset">
      <input type="number" id="goto_offset" min="0" max="0" />
    </div>
  </fieldset>
  <fieldset class="box">
    <legend>radix</legend>
    <div class="radix">
      <select id="radix">
        <option value="2">2 (BIN)</option>
        <option value="8">8 (OCT)</option>
        <option value="10">10 (DEC)</option>
        <option value="16" selected>16 (HEX)</option>
      </select>
    </div>
  </fieldset>
  <fieldset class="box">
    <legend>misc</legend>
    <div class="radix">
      <label
        >advanced mode<input
          type="checkbox"
          id="advanced_mode"
          checked
        /></label
      >
    </div>
  </fieldset>
</header>

<main class="dataEditor" id="data_editor">
  <div class="hd">address</div>
  <div class="hd">physical</div>
  <div class="hd">logical</div>
  <div class="hd">edit</div>
  <div class="measure" style="align-items: center;">
    <select class="address_type" id="address_numbering" style="min-width: 100%;">
      <option value="10">Decimal</option>
      <option value="16">Hexadecimal</option>
      <option value="8">Octal</option>
      <option value="2">Binary</option>
    </select>
  </div>
  <div class="measure"><span id="physical_offsets" /></div>
  <div class="measure"><span id="logical_offsets" /></div>
  <div class="measure">
    <div>
      <span id="selected_offsets">-</span><br />
      <span id="editor_offsets">-</span>
    </div>
  </div>
  <textarea class="address_vw" id="address" readonly />
  <textarea class="physical_vw" id="physical" readonly />
  <textarea class="logicalView" id="logical" readonly />
  <div class="editView" id="edit_view">
    <textarea class="selectedContent" id="editor" />
    <fieldset class="box">
      <legend>content controls</legend>
      <div class="contentControls" id="content_controls">
        <div>
          <button id="commit_btn" disabled> commit changes </button>
          committed changes: <span id="change_cnt">0</span>
          <button id="add_data_breakpoint_btn" disabled>
            set breakpoint
          </button>
          breakpoints: <span id="data_breakpoint_cnt">0</span>
        </div>
        <hr />
        <div class="grid-container-two-columns">
          <div class="grid-container-column">
            <div>
              <label
                >endianness:
                <select id="endianness">
                  <option value="le">little</option>
                  <option value="be">big</option>
                </select>
              </label>
            </div>
            <div>
              <label
                >encoding:
                <select id="edit_encoding">
                  <optgroup label="Binary Encodings">
                    <option value="hex">Hexadecimal</option>
                    <option value="binary">Binary</option>
                    <option value="base64">Base64</option>
                  </optgroup>
                  <optgroup label="Single-Byte Character Encodings">
                    <option value="ascii">ASCII (7-bit)</option>
                    <option value="latin1">ISO-8859-1 (8-bit)</option>
                  </optgroup>
                  <optgroup label="Multi-Byte Character Encodings">
                    <option value="ucs2">UCS-2</option>
                    <option value="utf-8" selected>UTF-8</option>
                    <option value="utf-16le">UTF-16LE</option>
                  </optgroup>
                </select>
              </label>
            </div>
            <div class="advanced">
              <label
                >least significant bit:
                <select id="lsb">
                  <option value="h">higher offset</option>
                  <option value="l">lower offset</option>
                </select>
              </label>
            </div>
            <div class="advanced">
              <label
                >logical byte size:
                <select id="logical_byte_size">
                  <option>8</option>
                  <option>7</option>
                  <option>6</option>
                </select>
              </label>
            </div>
          </div>
          <div class="grid-container-column">
            <div id="data_vw" hidden>
              &nbsp;Offset: <span id="offset_dv">-</span>
              <span id="b8_dv">
                <br /><label
                  >&nbsp;&nbsp;&nbsp;int8: <input id="int8_dv" /></label
                >
                <br /><label>&nbsp;&nbsp;uint8: <input id="uint8_dv" /></label>
              </span>
              <span id="b16_dv">
                <br /><label>&nbsp;&nbsp;int16: <input id="int16_dv" /></label>
                <br /><label>&nbsp;uint16: <input id="uint16_dv" /></label>
              </span>
              <span id="b32_dv">
                <br /><label>&nbsp;&nbsp;int32: <input id="int32_dv" /></label>
                <br /><label>&nbsp;uint32: <input id="uint32_dv" /></label>
                <br /><label>float32: <input id="float32_dv" /></label>
              </span>
              <span id="b64_dv">
                <br /><label>&nbsp;&nbsp;int64: <input id="int64_dv" /></label>
                <br /><label>&nbsp;uint64: <input id="uint64_dv" /></label>
                <br /><label>float64: <input id="float64_dv" /></label>
              </span>
            </div>
          </div>
        </div>
      </div>
    </fieldset>
  </div>
</main>
<div id='test'>.</div>

<!-- svelte-ignore css-unused-selector -->
<style lang="scss">
  /* CSS reset */
  *,
  *:before,
  *:after {
    box-sizing: inherit;
    margin: 0;
    padding: 0;
    font-weight: normal;
  }

  /* fonts */
  main {
    font-family: monospace;
    font-size: 12px;
    min-height: 100%;
  }

  legend {
    font-weight: bold;
  }

  header {
    display: flex;
    justify-content: center;
    width: 100%;
    flex: 0 1 auto;
  }

  button,
  input,
  select,
  textarea {
    color: inherit;
    background-color: inherit;
    font: inherit;
    resize: none;
    width: auto;
    border: 0;
  }
  .dataEditor {
    display: grid;
    /* I think this should be 32em instead of 19em for 32 characters, but that didn't work */
    grid-template-columns: max-content max-content max-content auto;
    grid-template-rows: max-content max-content auto;
    gap: 1px;
    overflow: auto;
    resize: vertical;
    min-height: 500px;
    font-family: monospace;
  }
  /* display of binary encoded data takes more space in the physical view */
  .dataEditor.binary {
    /* I think this should be 16em instead of 10em for 16 characters, but that didn't work */
    grid-template-columns: max-content max-content 10em auto;
  }

  .dataEditor div {
    resize: none;
  }

  .dataEditor textarea {
    display: block;
    word-break: break-all;
    white-space: break-spaces;
    box-sizing: content-box;
    height: 100%;
    width: 100%;
  }

  .dataEditor div.hd {
    background: #767676;
    text-align: center;
    font-weight: bold;
  }

  .dataEditor div.measure {
    display: flex;
  }

  .dataEditor div.measure span {
    align-self: flex-end;
  }

  .dataEditor textarea.address_vw {
    text-align: right;
    direction: rtl;
    user-select: none;
    cursor: not-allowed;
    pointer-events: none;
  }

  .dataEditor textarea.physical_vw {
    background: #4c4c4c;
  }

  .dataEditor textarea.logicalView {
    background: #3c3c3c;
  }

  .dataEditor div.editView {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr max-content;
    overflow-x: scroll;
  }

  .dataEditor textarea.selectedContent {
    background: #2c2c2c;
  }

  .dataEditor button {
    margin: 5px;
    padding: 4px 8px;
    background: darkgreen;
    border: 1px solid #dedede;
    font-weight: bold;
    border-radius: 3px;
    cursor: pointer;
  }

  .dataEditor button:active {
    background: lime;
    font-weight: bolder;
    color: black;
    box-shadow: inset 0 0 5px white;
    outline: none;
  }

  .dataEditor button:disabled {
    color: #444444;
    border: 1px solid #444444;
    font-weight: lighter;
    background: #696969;
    cursor: not-allowed;
    pointer-events: none;
  }

  .grid-container-two-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .grid-container-column {
    border: 1px solid whitesmoke;
  }
</style>
