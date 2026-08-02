/**
 * woff-to-ttf.mjs — Convert WOFF font files to raw TTF format.
 * 
 * WOFF = { WOFFHeader | TableDirectory[] | FontTables[] }
 * Each table is stored compressed with zlib (or uncompressed).
 * We strip the WOFF wrapper and reconstruct a valid TrueType file.
 * 
 * Usage: node scripts/woff-to-ttf.mjs [inputDir] [outputDir]
 */

import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

function readUint32BE(buf, offset) {
  return buf.readUInt32BE(offset)
}

function readUint16BE(buf, offset) {
  return buf.readUInt16BE(offset)
}

/**
 * Convert a WOFF buffer to a TTF buffer.
 * Reference: https://www.w3.org/TR/WOFF/
 */
function woffToTtf(woffBuffer) {
  const signature = readUint32BE(woffBuffer, 0)
  if (signature !== 0x774F4646) {
    throw new Error(`Not a WOFF file (signature: 0x${signature.toString(16)})`)
  }

  const sfVersion = readUint32BE(woffBuffer, 4)   // Original TrueType/CFF version
  const numTables = readUint16BE(woffBuffer, 12)
  // const reserved = readUint16BE(woffBuffer, 14)
  // const totalSfntSize = readUint32BE(woffBuffer, 16)

  // Parse WOFF table directory (starts at offset 44)
  const tables = []
  let dirOffset = 44
  for (let i = 0; i < numTables; i++) {
    const tag = woffBuffer.subarray(dirOffset, dirOffset + 4).toString('ascii')
    const woffOffset = readUint32BE(woffBuffer, dirOffset + 4)
    const compLength = readUint32BE(woffBuffer, dirOffset + 8)
    const origLength = readUint32BE(woffBuffer, dirOffset + 12)
    const origChecksum = readUint32BE(woffBuffer, dirOffset + 16)

    // Extract and decompress the table data
    const compressedData = woffBuffer.subarray(woffOffset, woffOffset + compLength)
    let tableData
    if (compLength < origLength) {
      // Data is zlib-compressed
      tableData = zlib.inflateSync(compressedData)
      if (tableData.length !== origLength) {
        throw new Error(`Table '${tag}' decompressed to ${tableData.length}, expected ${origLength}`)
      }
    } else {
      // Data is uncompressed
      tableData = compressedData
    }

    tables.push({ tag, data: tableData, origLength, checksum: origChecksum })
    dirOffset += 20
  }

  // Now reconstruct a valid TrueType file
  // TrueType offset table: 12 bytes
  // Table record: 16 bytes per table
  const headerSize = 12 + numTables * 16

  // Calculate searchRange, entrySelector, rangeShift
  let searchRange = 1
  let entrySelector = 0
  while (searchRange * 2 <= numTables) {
    searchRange *= 2
    entrySelector++
  }
  searchRange *= 16
  const rangeShift = numTables * 16 - searchRange

  // Calculate total size with padding
  let totalSize = headerSize
  for (const t of tables) {
    totalSize += t.data.length
    // Pad to 4-byte boundary
    const padding = (4 - (t.data.length % 4)) % 4
    totalSize += padding
  }

  const ttf = Buffer.alloc(totalSize)
  let writeOffset = 0

  // Write offset table (12 bytes)
  ttf.writeUInt32BE(sfVersion, writeOffset); writeOffset += 4
  ttf.writeUInt16BE(numTables, writeOffset); writeOffset += 2
  ttf.writeUInt16BE(searchRange, writeOffset); writeOffset += 2
  ttf.writeUInt16BE(entrySelector, writeOffset); writeOffset += 2
  ttf.writeUInt16BE(rangeShift, writeOffset); writeOffset += 2

  // Write table directory and data
  let dataOffset = headerSize
  for (const t of tables) {
    // Write table record (16 bytes each)
    ttf.write(t.tag, writeOffset, 4, 'ascii'); writeOffset += 4
    ttf.writeUInt32BE(t.checksum, writeOffset); writeOffset += 4
    ttf.writeUInt32BE(dataOffset, writeOffset); writeOffset += 4
    ttf.writeUInt32BE(t.data.length, writeOffset); writeOffset += 4

    // Write table data at the data offset
    t.data.copy(ttf, dataOffset)
    dataOffset += t.data.length
    // Pad to 4-byte boundary
    const padding = (4 - (t.data.length % 4)) % 4
    dataOffset += padding
  }

  return ttf
}

// Main
const inputDir = process.argv[2] || 'src/render/fonts/carlito'
const outputDir = process.argv[3] || 'src/render/fonts/carlito'

const woffFiles = fs.readdirSync(inputDir).filter(f => f.endsWith('.woff') && !f.endsWith('.woff2'))

for (const woffFile of woffFiles) {
  const inputPath = path.join(inputDir, woffFile)
  const outputFile = woffFile.replace('.woff', '.ttf')
  const outputPath = path.join(outputDir, outputFile)

  console.log(`Converting: ${woffFile} → ${outputFile}`)
  const woffBuffer = fs.readFileSync(inputPath)
  const ttfBuffer = woffToTtf(woffBuffer)
  fs.writeFileSync(outputPath, ttfBuffer)
  console.log(`  ✓ ${woffBuffer.length} bytes → ${ttfBuffer.length} bytes`)
}

console.log('\nDone! TTF files written.')
