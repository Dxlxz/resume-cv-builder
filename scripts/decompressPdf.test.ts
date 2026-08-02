/**
 * Decompress and inspect the actual PDF content streams
 * to understand what drawing operations react-pdf produces.
 */
import { describe, it } from 'vitest'
import fs from 'fs'
import path from 'path'
import zlib from 'zlib'

function decompressStreams(buffer: Buffer, label: string) {
  const raw = buffer.toString('latin1')
  
  console.log(`\n========== ${label} — Decompressed Streams ==========`)
  
  // Find all stream...endstream blocks
  const streamRegex = /stream\r?\n([\s\S]*?)endstream/g
  let match
  let streamIndex = 0
  
  while ((match = streamRegex.exec(raw)) !== null) {
    streamIndex++
    const streamData = Buffer.from(match[1], 'latin1')
    
    let decompressed: string
    try {
      const inflated = zlib.inflateSync(streamData)
      decompressed = inflated.toString('latin1')
    } catch {
      // Try with trimmed data (remove trailing whitespace)
      try {
        const trimmed = streamData.subarray(0, streamData.length - 1)
        const inflated = zlib.inflateSync(trimmed)
        decompressed = inflated.toString('latin1')
      } catch {
        decompressed = streamData.toString('latin1')
      }
    }
    
    // Check if this looks like a content stream (has PDF operators)
    const isContentStream = /\b(BT|ET|Tf|Td|Tj|TJ|cm|re|f|S|q|Q|rg|RG|g|G|Do)\b/.test(decompressed)
    
    if (isContentStream) {
      console.log(`\n--- Stream #${streamIndex} (content stream, ${decompressed.length} bytes) ---`)
      // Show first 2000 chars
      console.log(decompressed.substring(0, 2000))
      if (decompressed.length > 2000) {
        console.log(`... (${decompressed.length - 2000} more bytes)`)
      }
      
      // Analyze specific operators
      const btCount = (decompressed.match(/\bBT\b/g) || []).length
      const tjCount = (decompressed.match(/\bTj\b/g) || []).length
      const tjArrayCount = (decompressed.match(/\bTJ\b/g) || []).length
      const tfCount = (decompressed.match(/\bTf\b/g) || []).length
      const trMatches = decompressed.match(/(\d+)\s+Tr/g)
      const rgMatches = decompressed.match(/[\d.]+ [\d.]+ [\d.]+ rg/g)
      const gMatches = decompressed.match(/([\d.]+)\s+g(?:\s|$)/g)
      
      console.log(`\nOperator counts:`)
      console.log(`  BT (begin text): ${btCount}`)
      console.log(`  Tj (show text): ${tjCount}`)
      console.log(`  TJ (show text array): ${tjArrayCount}`)
      console.log(`  Tf (set font): ${tfCount}`)
      console.log(`  Tr (text render mode): ${trMatches || 'none'}`)
      console.log(`  rg (RGB fill color): ${rgMatches?.slice(0, 5) || 'none'}`)
      console.log(`  g (gray fill): ${gMatches?.slice(0, 5) || 'none'}`)
      
      // Check for invisible text rendering mode (Tr 3 = invisible)
      if (trMatches) {
        for (const tr of trMatches) {
          if (tr.includes('3 Tr')) {
            console.log(`  ⚠️ INVISIBLE TEXT RENDERING MODE FOUND: ${tr}`)
          }
        }
      }
      
      // Check for white text (1 1 1 rg)
      if (rgMatches) {
        for (const rg of rgMatches) {
          if (rg === '1 1 1 rg') {
            console.log(`  ⚠️ WHITE TEXT COLOR FOUND: ${rg}`)
          }
        }
      }
    } else {
      console.log(`\n--- Stream #${streamIndex} (font/binary data, ${streamData.length} bytes) --- [skipped]`)
    }
  }
}

describe('PDF Stream Decompression', () => {
  it('decompresses Helvetica PDF streams', () => {
    const filePath = path.join(process.cwd(), 'TEST_Helvetica.pdf')
    if (!fs.existsSync(filePath)) {
      console.log('TEST_Helvetica.pdf not found, run the generation test first')
      return
    }
    const buffer = fs.readFileSync(filePath)
    decompressStreams(buffer, 'Helvetica')
  })

  it('decompresses Production PDF streams', () => {
    const filePath = path.join(process.cwd(), 'TEST_Production.pdf')
    if (!fs.existsSync(filePath)) {
      console.log('TEST_Production.pdf not found, run the generation test first')
      return
    }
    const buffer = fs.readFileSync(filePath)
    decompressStreams(buffer, 'Production Resume')
  })
})
