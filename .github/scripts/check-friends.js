const fs = require('fs')
const axios = require('axios')
const path = 'source/friends/friends.json'
const list = JSON.parse(fs.readFileSync(path, 'utf8'))

async function check() {
  const valid = []
  for (const item of list) {
    try {
      await axios.get(item.url, { timeout: 5000 })
      valid.push(item)
    } catch (e) {
      console.log('失效:', item.name, item.url)
    }
  }
  fs.writeFileSync(path, JSON.stringify(valid, null, 2), 'utf8')
}
check()