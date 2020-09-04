const { promisify } = require("util")
const fs = require("fs")
const path = require("path")
const rollup = require("rollup")
const { minify } = require("terser")

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

const bundleName = "ladc"
const srcPath = path.join(__dirname, "..", "src")
const compiledPath = path.join(__dirname, "compiled")
const distNpmPath = path.join(__dirname, "..")

async function build() {
  const bundle = await rollup.rollup({
    input: path.join(compiledPath, "index.js")
  })
  const { output } = await bundle.generate({
    format: "commonjs",
    exports: "named",
    sourcemap: false,
  })

  const minified = await minify(output[0].code, { sourceMap: false })
  if (minified.error)
    throw minified.error
  if (!minified.code)
    throw new Error("Missing code")

  await writeFile(path.join(distNpmPath, `${bundleName}.min.js`), minified.code)
  await writeFile(path.join(distNpmPath, `${bundleName}.d.ts`), await makeDefinitionsCode())
}

async function makeDefinitionsCode() {
  const defs = [
    "// -- Usage definitions --",
    removeLocalImportsExports((await readFile(path.join(srcPath, "exported-definitions.d.ts"), "utf-8")).trim()),
    "// -- Adapter definitions --",
    removeLocalImportsExports((await readFile(path.join(srcPath, "adapter-definitions.d.ts"), "utf-8")).trim()),
    "// -- Entry point definition --",
    removeSemicolons(
      removeLocalImportsExports((await readFile(path.join(compiledPath, "index.d.ts"), "utf-8")).trim()),
    )
  ]
  return defs.join("\n\n")
}

function removeLocalImportsExports(code) {
  const localImportExport = /^\s*(import|export) .* from "\.\/.*"\s*;?\s*$/
  return code.split("\n").filter(line => {
    return !localImportExport.test(line)
  }).join("\n").trim()
}

function removeSemicolons(code) {
  return code.replace(/;/g, "")
}

build().catch(err => console.log(err.message, err.stack))
