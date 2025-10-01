// Utility untuk backup dan restore data
class FirestoreBackup {
  constructor(db, configPath, accountsPath, answersPath) {
    this.db = db;
    this.configPath = configPath;
    this.accountsPath = accountsPath;
    this.answersPath = answersPath;
  }

  // Export semua data ke JSON
  async exportAllData() {
    try {
      const [config, accounts, answers] = await Promise.all([
        this.exportConfig(),
        this.exportAccounts(),
        this.exportAnswers()
      ]);

      return {
        timestamp: new Date().toISOString(),
        config,
        accounts,
        answers
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  async exportConfig() {
    const docRef = firebase.doc(this.db, this.configPath, 'mainConfig');
    const docSnap = await firebase.getDocs(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  }

  async exportAccounts() {
    const accountsCollectionRef = firebase.collection(this.db, this.accountsPath);
    const snapshot = await firebase.getDocs(accountsCollectionRef);
    return snapshot.docs.map(doc => doc.data());
  }

  async exportAnswers() {
    const answersCollectionRef = firebase.collection(this.db, this.answersPath);
    const snapshot = await firebase.getDocs(answersCollectionRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Download data sebagai file JSON
  downloadAsJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Import data dari JSON
  async importData(importData) {
    const batch = firebase.writeBatch(this.db);

    // Import config
    if (importData.config) {
      const configRef = firebase.doc(this.db, this.configPath, 'mainConfig');
      batch.set(configRef, importData.config);
    }

    // Import accounts
    if (importData.accounts) {
      importData.accounts.forEach(account => {
        const accountRef = firebase.doc(this.db, this.accountsPath, account.username);
        batch.set(accountRef, account);
      });
    }

    // Import answers (optional - biasanya tidak di-import)
    if (importData.answers) {
      importData.answers.forEach(answer => {
        const answerRef = firebase.doc(this.db, this.answersPath);
        batch.set(answerRef, answer);
      });
    }

    await batch.commit();
    return true;
  }
}

// Fungsi global untuk diakses dari aplikasi utama
window.backupUtility = {
  createBackup: async function(db) {
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const backup = new FirestoreBackup(
      db,
      `artifacts/${appId}/public/data/quiz_config`,
      `artifacts/${appId}/public/data/user_accounts`,
      `artifacts/${appId}/public/data/quiz_answers`
    );
    
    const data = await backup.exportAllData();
    backup.downloadAsJSON(data, `backup_kuis_${new Date().toISOString().split('T')[0]}.json`);
    return data;
  },

  restoreBackup: async function(db, jsonData) {
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const backup = new FirestoreBackup(
      db,
      `artifacts/${appId}/public/data/quiz_config`,
      `artifacts/${appId}/public/data/user_accounts`,
      `artifacts/${appId}/public/data/quiz_answers`
    );
    
    return await backup.importData(jsonData);
  }
};