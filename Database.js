const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

module.exports = class Database {
    constructor(dbPath) {
        const adapter = new FileSync(dbPath);
        this.raw = low(adapter);
        this.raw.defaults({channels:[],subscribes:[]}).write();
    }

    isRecordExists(table, id) {
        return (this.raw.get(table).find({id}).value() !== undefined);
    }

    getUniqueId(table) {
        const id = Math.random().toString(36).substring(2, 6);
        if (this.isRecordExists(table, id))
            this.getUniqueId(table);
        return id;     
    }

    createNewChannel() {
        const id = this.getUniqueId('channels');
        this.raw.get('channels').push({id}).write();
        return id;
    }

    isAlredySubscribed(chatId, token) {
        return this.raw
                .get('subscribes')
                .filter({chatId})
                .value()
                .some(item => item.token === token);
    }
    
    addSubscribe(token, chatId) {
        const id = this.getUniqueId('subscribes');
        this.raw.get('subscribes').push({id, token, chatId}).write();
        return id;
    }
}