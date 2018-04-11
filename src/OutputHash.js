const crypto = require('crypto');
const fs = require('fs');

function OutputHash({
    validateOutput = false,
    validateOutputRegex = /^.*$/,
} = {}) {
    this.validateOutput = validateOutput;
    this.validateOutputRegex = validateOutputRegex;
}

/**
 * Replaces a string in an asset
 */
function replaceStringInAsset(asset, source, target) {
    const sourceRE = new RegExp(source, 'g');

    if (typeof asset === 'string') {
        return asset.replace(sourceRE, target);
    }

    // ReplaceSource
    if ('_source' in asset) {
        asset._source = replaceStringInAsset(asset._source, source, target);
        return asset;
    }

    // CachedSource
    if ('_cachedSource' in asset) {
        asset._cachedSource = asset.source().replace(sourceRE, target);
        return asset;
    }

    // RawSource / SourceMapSource
    if ('_value' in asset) {
        asset._value = asset.source().replace(sourceRE, target);
        return asset;
    }

    // ConcatSource
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

/**
 * Replaces old hashes for new hashes in chunk files.
 *
 * This function iterates through file contents and replaces all the ocurrences of old hashes
 * for new ones. We assume hashes are unique enough, so that we don't accidentally hit a
 * collision and replace existing data.
 */
function replaceOldHashForNewInChunkFiles(chunk, assets, oldHashToNewHashMap) {
    chunk.files.forEach((file) => {
        Object.keys(oldHashToNewHashMap).forEach((oldHash) => {
            const newHash = oldHashToNewHashMap[oldHash];
            replaceStringInAsset(assets[file], oldHash, newHash);
        });
    });
}

OutputHash.prototype.apply = function apply(compiler) {
    let hashFn;

    compiler.hooks.compilation.tap('OutputHash', (compilation) => {
        const { outputOptions } = compilation;
        const {
            hashFunction, hashDigest, hashDigestLength, hashSalt,
        } = outputOptions;

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
        compilation.hooks.afterOptimizeChunks.tap('Capture chunks', (chunks, chunkGroups) => {
            this.chunks = chunks;
            this.chunkGroups = chunkGroups;
        });

        compilation.hooks.afterOptimizeAssets.tap('Update chunks', (assets) => {
            const sortedChunks = [];
            const visitedGroups = [];
            const nameMap = {};

            const extractInOrder = (group) => {
                // Mark the group as processed
                visitedGroups.push(group);

                // For each child group, process it if it hasn't been processed before
                group.getChildren().forEach((child) => {
                    if (!visitedGroups.includes(child)) extractInOrder(child);
                });

                // For each chunk in this group
                //   - Get all groups containing that chunk (that includes this group)
                //   - If the group hasn't been processed yet, process it (this will skip current
                //     group)
                //   - After all groups containing the chunk have been processed, add the chunk to
                //     the list of sortedChunks
                group.chunks.forEach((chunk) => {
                    Array.from(chunk.groupsIterable).forEach((parentGroup) => {
                        if (!visitedGroups.includes(parentGroup)) extractInOrder(parentGroup);
                    });
                    if (!sortedChunks.includes(chunk)) sortedChunks.push(chunk);
                });
            };

            this.chunkGroups.forEach(extractInOrder);

            sortedChunks.forEach((chunk) => {
                replaceOldHashForNewInChunkFiles(chunk, assets, nameMap);
                const { newHash, oldHash } = reHashChunk(chunk, assets, hashFn);
                nameMap[oldHash] = newHash;
            });
        });
    });

    if (this.validateOutput) {
        compiler.hooks.afterEmit.tapAsync('Validate output', (compilation, callback) => {
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
