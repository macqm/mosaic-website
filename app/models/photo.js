var azure = require('azure-storage');
var entityGen = azure.TableUtilities.entityGenerator;
var uuid = require('node-uuid');

function Photo(storageClient, tableName, partitionKey) {
  this.storageClient = storageClient;
  this.tableName = tableName;
  this.partitionKey = partitionKey;
  this.storageClient.createTableIfNotExists(tableName, function tableCreated(error) {
    if(error) {
      throw error;
    }
  });
};


Photo.prototype = {
  find: function(query, callback) {
    self = this;
    self.storageClient.queryEntities(this.tableName, query, null, function entitiesQueried(error, result) {
      if(error) {
        callback(error);
      } else {
        callback(null, result.entries);
      }
    });
  },

  addItem: function(item, callback) {
    self = this;

    // use entityGenerator to set types
    // NOTE: RowKey must be a string type, even though
    // it contains a GUID in this example.
    var itemDescriptor = {
      PartitionKey: entityGen.String(self.partitionKey),
      RowKey: entityGen.String(item.imageName),
      hue: entityGen.Int32(item.hue || -1),
      saturation: entityGen.Int32(item.saturation || -1),
      value: entityGen.Int32(item.value || -1),
      local: entityGen.Boolean(item.local || true),
      thumbnail: entityGen.String(item.thumbnail || null),
      userId: entityGen.String(item.userId),
      parent: entityGen.String(item.parent || "")
    };
    
    self.storageClient.insertEntity(self.tableName, itemDescriptor, function entityInserted(error) {
      if(error){  
        callback(error);
      }
      callback(null);
    });
  },

  updateItem: function(rKey, callback) {
    self = this;
    self.storageClient.retrieveEntity(self.tableName, self.partitionKey, rKey, function entityQueried(error, entity) {
      if(error) {
        callback(error);
      }
      entity.completed._ = true;
      self.storageClient.updateEntity(self.tableName, entity, function entityUpdated(error) {
        if(error) {
          callback(error);
        }
        callback(null);
      });
    });
  }
}


module.exports = Photo;