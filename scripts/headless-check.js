const fs = require('fs')
const path = require('path')
const url = process.env.URL || 'http://localhost:3000'
;(async () => {
  try {
    const { chromium } = require('playwright')
    const browser = await chromium.launch({ headless: true })
    const context = await browser.newContext()
    const page = await context.newPage()

    const logs = []
    page.on('console', msg => {
      const text = `[console:${msg.type()}] ${msg.text()}`
      logs.push(text)
      console.log(text)
    })

    page.on('pageerror', err => {
      const text = `[pageerror] ${err.stack || err.message || err}`
      logs.push(text)
      console.error(text)
    })

    page.on('requestfailed', req => {
      const text = `[requestfailed] ${req.method()} ${req.url()} ${req.failure()?.errorText || ''}`
      logs.push(text)
      console.error(text)
    })

    console.log(`Visiting: ${url}`)
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })

    // wait a bit for client-side JS to run
    await page.waitForTimeout(3000)

    // Also capture the page title and status
    try {
      const title = await page.title()
      logs.unshift(`[info] title: ${title}`)
    } catch (e) {}

    const outLog = path.resolve(process.cwd(), 'headless-console.log')
    fs.writeFileSync(outLog, logs.join('\n') + '\n')
    console.log(`Wrote console log to: ${outLog}`)

    const screenshotPath = path.resolve(process.cwd(), 'headless-screenshot.png')
    await page.screenshot({ path: screenshotPath, fullPage: true })
    console.log(`Saved screenshot to: ${screenshotPath}`)

    await browser.close()
    process.exit(0)
  } catch (err) {
    console.error('Headless script failed:', err)
    process.exit(2)
  }
})()
