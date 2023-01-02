"use strict"
import * as assert from "assert"
import * as fs from "fs"
import * as path from "path"
import { readGrammar, readSnippets } from "../../readTemplates"

function sanitize(fileString: string) {
  fileString = fileString.replace("\\r\\n", "\n")
  fileString = fileString.replace("\\r", "\n")
  return fileString
}

suite("Build Tests", () => {
  test("Build directives", () => {
    const expected = fs.readFileSync(
      path.join(__dirname, "../../../syntaxes", "myst.tmLanguage"),
      "utf8"
    )
    const plistString = readGrammar(true) as string
    assert.equal(sanitize(plistString), sanitize(expected))
  })

  test("Build snippets", () => {
    const expected = fs.readFileSync(
      path.join(__dirname, "../../../snippets", "directives.json"),
      "utf8"
    )
    const jsonString = readSnippets(true)
    assert.equal(sanitize(jsonString as string), sanitize(expected))
  })
})
