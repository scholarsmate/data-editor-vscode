
export function fileExtensionType(filename: string): string {
    return filename.substring( filename.lastIndexOf('.') )
}

export function makeOffsetRange(radix: number, spread: number): string {
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

export function makeAddressRange(
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

export function encodeForDisplay(
    arr: Uint8Array,
    radix: number,
    bytesPerRow: number
  ): string {
    let result = ''
    if (arr.byteLength > 0) {
      const pad = radixBytePad(radix)
      let i = 0
      while (true) {
        for (let col = 0; i < arr.byteLength && col < bytesPerRow; ++col) {
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

function latin1Undefined(c: string): boolean {
  const charCode = c.charCodeAt(0)
  return charCode < 32 || (charCode > 126 && charCode < 160)
}

export function logicalDisplay(bytes: ArrayBuffer, bytesPerRow: number): string {
  const undefinedCharStandIn = '�'
  let result = ''
  if (bytes.byteLength > 0) {
    const data = Buffer.from(bytes).toString('latin1').replaceAll('\n', ' ')
    let i = 0
    while (true) {
      for (let col = 0; i < data.length && col < bytesPerRow; ++col) {
        const c = data.charAt(i++)
        result += (latin1Undefined(c) ? undefinedCharStandIn : c) + ' '
      }
      result = result.slice(0, result.length - 1)
      if (i === data.length) {
        break
      }
      result += '\n'
    }
  }
  return result
}