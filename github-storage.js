// ---------- SISTEM PENYIMPANAN GITHUB ----------
class GitHubStorage {
    constructor() {
        this.owner = 'kko-legok'; // Ganti dengan username GitHub Anda
        this.repo = 'quiz'; // Ganti dengan nama repository Anda
        this.token = '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'; // Ganti dengan token GitHub Anda
        this.baseUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/contents`;
        this.branch = 'main';
        
        // Data lokal sebagai cache
        this.localData = {
            config: null,
            accounts: {},
            answers: []
        };
        
        this.isInitialized = false;
    }

    // Helper untuk request GitHub API
    async githubRequest(url, options = {}) {
        const headers = {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            ...options.headers
        };

        try {
            const response = await fetch(url, { ...options, headers });
            
            if (response.status === 404) {
                return null; // File tidak ditemukan
            }
            
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('GitHub request failed:', error);
            throw error;
        }
    }

    // Membaca file dari GitHub
    async readFile(filename) {
        try {
            const url = `${this.baseUrl}/data/${filename}?ref=${this.branch}`;
            const fileData = await this.githubRequest(url);
            
            if (!fileData) {
                return null; // File tidak ada
            }
            
            // Decode content dari base64
            const content = atob(fileData.content.replace(/\n/g, ''));
            return JSON.parse(content);
        } catch (error) {
            console.error(`Error reading ${filename}:`, error);
            return null;
        }
    }

    // Menyimpan file ke GitHub
    async saveFile(filename, data, commitMessage = 'Update data') {
        try {
            // Cek apakah file sudah ada untuk mendapatkan SHA
            const existingFile = await this.readFile(filename);
            let sha = null;
            
            if (existingFile) {
                const checkUrl = `${this.baseUrl}/data/${filename}?ref=${this.branch}`;
                const fileInfo = await this.githubRequest(checkUrl);
                sha = fileInfo?.sha;
            }
            
            // Encode data ke base64
            const content = btoa(JSON.stringify(data, null, 2));
            
            const url = `${this.baseUrl}/data/${filename}`;
            const body = {
                message: commitMessage,
                content: content,
                branch: this.branch
            };
            
            if (sha) {
                body.sha = sha;
            }
            
            const result = await this.githubRequest(url, {
                method: 'PUT',
                body: JSON.stringify(body)
            });
            
            console.log(`File ${filename} saved successfully`);
            return true;
        } catch (error) {
            console.error(`Error saving ${filename}:`, error);
            throw error;
        }
    }

    // Inisialisasi dan load semua data
    async initialize() {
        try {
            console.log('Initializing GitHub storage...');
            
            // Load config
            this.localData.config = await this.readFile('config.json') || {
                questions: [],
                durations: { kepala: 10, bendahara: 10, dapodik: 10 },
                branding: { logoData: null, text: "Penyelenggara Kuis" }
            };
            
            // Load accounts
            this.localData.accounts = await this.readFile('accounts.json') || { 
                admin: { username: "admin", password: "admin123", role: "admin", school: "Administrator" } 
            };
            
            // Load answers
            this.localData.answers = await this.readFile('answers.json') || [];
            
            this.isInitialized = true;
            console.log('GitHub storage initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize GitHub storage:', error);
            // Fallback ke data lokal
            this.localData.config = {
                questions: [],
                durations: { kepala: 10, bendahara: 10, dapodik: 10 },
                branding: { logoData: null, text: "Penyelenggara Kuis" }
            };
            this.localData.accounts = { 
                admin: { username: "admin", password: "admin123", role: "admin", school: "Administrator" } 
            };
            this.localData.answers = [];
            this.isInitialized = true;
        }
    }

    // ---------- OPERASI DATA ----------
    
    // Config operations
    async getConfig() {
        return this.localData.config;
    }

    async saveConfig(newConfig) {
        this.localData.config = newConfig;
        return await this.saveFile('config.json', newConfig, 'Update quiz configuration');
    }

    // Account operations
    async getAccounts() {
        return this.localData.accounts;
    }

    async saveAccount(accountData) {
        this.localData.accounts[accountData.username] = accountData;
        return await this.saveFile('accounts.json', this.localData.accounts, `Update account: ${accountData.username}`);
    }

    async deleteAccount(username) {
        delete this.localData.accounts[username];
        return await this.saveFile('accounts.json', this.localData.accounts, `Delete account: ${username}`);
    }

    // Answer operations
    async getAnswers() {
        return this.localData.answers;
    }

    async submitAnswer(answerData) {
        answerData.id = `ans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.localData.answers.push(answerData);
        return await this.saveFile('answers.json', this.localData.answers, `New answer from: ${answerData.username}`);
    }

    // Backup operations
    async createBackup() {
        const backupData = {
            config: this.localData.config,
            accounts: this.localData.accounts,
            answers: this.localData.answers,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        
        const timestamp = new Date().toISOString().split('T')[0];
        return await this.saveFile(`backup_${timestamp}.json`, backupData, `Backup created: ${timestamp}`);
    }

    async restoreBackup(backupData) {
        if (backupData.config) this.localData.config = backupData.config;
        if (backupData.accounts) this.localData.accounts = backupData.accounts;
        if (backupData.answers) this.localData.answers = backupData.answers;
        
        // Save all data
        await this.saveFile('config.json', this.localData.config, 'Restore backup: config');
        await this.saveFile('accounts.json', this.localData.accounts, 'Restore backup: accounts');
        await this.saveFile('answers.json', this.localData.answers, 'Restore backup: answers');
        
        return true;
    }
}

// Buat instance global
window.githubStorage = new GitHubStorage();
