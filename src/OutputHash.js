const crypto = require('crypto');
const fs = require('fs');

function OutputHash({
    manifestFiles = [],
    validateOutput = false,
    validateOutputRegex = /^.*$/,
} = {}) {
    this.manifestFiles = manifestFiles;
    this.validateOutput = validateOutput;
    this.validateOutputRegex = validateOutputRegex;
}

/**
 * Replaces a string in an asset
 */
function replaceStringInAsset(asset, source, target) {
    if (typeof asset === 'string') {
        return asset.replace(source, target);
    }

    if ('_cachedSource' in asset) {
        asset._cachedSource = asset.source().replace(source, target);
        return asset;
    }

    if ('_value' in asset) {
        asset._value = asset.source().replace(source, target);
        return asset;
    }

    if ('children' in asset) {
        asset.children = asset.children.map(child => replaceStringInAsset(child, source, target));
        return asset;
    }

    throw new Error(`Unknown asset type (${asset.constructor.name})!. ` +
        'Unfortunately this type of asset is not supported yet. ' +
        'Please raise an issue and we will look into it asap');
}

/**
 * Computes the new hash of a chunk.
 *
 * This function updates the *name* of the main file (i.e. source code), and the *content* of the
 * secondary files (i.e source maps)
 */
function reHashChunk(chunk, assets, hashFn) {
    const oldHash = chunk.renderedHash;
    const oldChunkName = chunk.files[0];
    const asset = assets[oldChunkName];
    const { fullHash, shortHash } = hashFn(asset.source());
    const newChunkName = oldChunkName.replace(oldHash, shortHash);

    // Update the main file of the chunk with the new name
    chunk.hash = fullHash;
    chunk.renderedHash = shortHash;
    chunk.files[0] = newChunkName;

    // Update the asset associated with that file
    asset._name = newChunkName;
    delete assets[oldChunkName];
    assets[newChunkName] = asset;

    // Update the content of the rest of the files in the chunk
    chunk.files.slice(1).forEach((file) => {
        const secondaryAsset = assets[file];
        replaceStringInAsset(secondaryAsset, oldHash, shortHash);
    });

    return {
        oldHash,
        newHash: shortHash,
    };
}

OutputHash.prototype.apply = function apply(compiler) {
    let hashFn;

    compiler.plugin('compilation', (compilation) => {
        const { outputOptions } = compilation;
        const { hashFunction, hashDigest, hashDigestLength, hashSalt } = outputOptions;

        // Reuses webpack options
        hashFn = (input) => {
            const hashObj = crypto.createHash(hashFunction).update(input);
            if (hashSalt) hashObj.update(hashSalt);
            const fullHash = hashObj.digest(hashDigest);
            return { fullHash, shortHash: fullHash.substr(0, hashDigestLength) };
        };

        // Webpack does not pass chunks and assets to any compilation step, but we need both.
        // To get them, we hook into 'optimize-chunk-assets' and save the chunks for processing
        // them later.
        compilation.plugin('after-optimize-chunk-assets', (chunks) => {
            this.chunks = chunks;
        });

        compilation.plugin('after-optimize-assets', (assets) => {
            const nameMap = {};

            // We assume that only the manifest chunk has references to all the other chunks.
            // It needs to be processed at the end, when we know the new names of all the other
            // chunks.
            this.chunks
                .filter(chunk => !this.manifestFiles.includes(chunk.name))
                .forEach((chunk) => {
                    const { newHash, oldHash } = reHashChunk(chunk, assets, hashFn);
                    nameMap[oldHash] = newHash;
                });

            // After the main files have been rehashed, we need to update the content of the
            // manifest files to point to the new rehashed names, and rehash them.
            this.chunks
                .filter(chunk => this.manifestFiles.includes(chunk.name))
                .forEach((chunk) => {
                    chunk.files.forEach((file) => {
                        Object.keys(nameMap).forEach((oldHash) => {
                            const newHash = nameMap[oldHash];
                            replaceStringInAsset(assets[file], oldHash, newHash);
                        });
                    });
                    reHashChunk(chunk, assets, hashFn);
                });
        });
    });

    if (this.validateOutput) {
        compiler.plugin('after-emit', (compilation, callback) => {
            let err;
            Object.keys(compilation.assets)
                .filter(assetName => assetName.match(this.validateOutputRegex))
                .forEach((assetName) => {
                    const asset = compilation.assets[assetName];
                    const path = asset.existsAt;
                    const assetContent = fs.readFileSync(path, 'utf8');
                    const { shortHash } = hashFn(assetContent);
                    if (!assetName.includes(shortHash)) {
                        err = new Error(`The hash in ${assetName} does not match the hash of the content (${shortHash})`);
                    }
                });
            return callback(err);
        });
    }
};

module.exports = OutputHash;
