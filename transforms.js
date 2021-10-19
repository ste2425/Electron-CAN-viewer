const { Transform } = require('stream');

/**
 * Transform that parses the string recieved from the Arduino into an object
 */
module.exports.CanMessageTransform = class CanMessageTransform extends Transform {
    constructor(ops) {
        super({ ...ops, writableObjectMode: true, readableObjectMode: true });
    }

    _transform(chunk, encoding, cb) {
        if (chunk.startsWith('[DBG]')) {
            return cb(null);
        } else {
            const parts = chunk.split('|'),
                id = parts[0],
                dataBlocks = parts.slice(1);
    
            if (!id){
                cb(null);
            } else {
                cb(null, {
                    id,
                    dataBlocks
                });
            }
        }
    }
}

/**
 * Transform that wil batch events coming trhough a stream and emit them in an array
 * 
 * Used for the UI to limit the speed of redraws, as a high rate of messages come through from the arduino
 */
module.exports.ChunkingTransform = class ChunkingTransform extends Transform {
    #chunkSize = 18;
    #hold = [];

    constructor(ops) {
        super({ ...ops, writableObjectMode: true, readableObjectMode: true });
    }

    _flush(cb) {
        cb(null, this.#hold);
    }

    _transform(chunck, encoding, cb) {
        this.#hold.push(chunck);

        if (this.#hold.length == this.#chunkSize) {
            cb(null, this.#hold);
            this.#hold = [];
        } else {
            cb();
        }
    }
}