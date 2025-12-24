// ========================================
// Blacklist Manager - ブラックリスト管理
// ========================================

const fs = require('fs').promises;
const path = require('path');

const BLACKLIST_FILE = path.join(__dirname, '../config/blacklist.json');

/**
 * ブラックリストを読み込み
 */
async function loadBlacklist() {
  try {
    const data = await fs.readFile(BLACKLIST_FILE, 'utf-8');
    const json = JSON.parse(data);
    return json.entries || [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      // ファイルがない場合は空配列
      return [];
    }
    throw error;
  }
}

/**
 * ブラックリストを保存
 */
async function saveBlacklist(entries) {
  const data = {
    version: '1.0',
    lastUpdated: new Date().toISOString(),
    entries
  };
  
  await fs.writeFile(BLACKLIST_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * ブラックリストにエントリを追加
 */
async function addEntry(entry) {
  const entries = await loadBlacklist();
  
  // 重複チェック
  if (entries.some(e => e.value === entry.value && e.type === entry.type)) {
    throw new Error('Entry already exists');
  }
  
  entries.push({
    ...entry,
    addedAt: Date.now()
  });
  
  await saveBlacklist(entries);
  return entries;
}

/**
 * ブラックリストからエントリを削除
 */
async function removeEntry(value) {
  const entries = await loadBlacklist();
  const filtered = entries.filter(e => e.value !== value);
  
  await saveBlacklist(filtered);
  return filtered;
}

/**
 * ブラックリストをクリア
 */
async function clearBlacklist() {
  await saveBlacklist([]);
}

/**
 * デフォルトのブラックリストを作成
 */
async function createDefaultBlacklist() {
  const defaultEntries = [
    {
      type: 'domain',
      value: 'example-blocked-site.com',
      reason: 'Example blocked domain',
      addedAt: Date.now()
    },
    {
      type: 'pattern',
      value: '.*\\.porn$',
      reason: 'Adult content pattern',
      addedAt: Date.now()
    }
  ];
  
  await saveBlacklist(defaultEntries);
  return defaultEntries;
}

module.exports = {
  loadBlacklist,
  saveBlacklist,
  addEntry,
  removeEntry,
  clearBlacklist,
  createDefaultBlacklist
};
