const md5 = require('md5');
const CachedSource = require('webpack-sources').CachedSource;

function OutputHash({
    hashSize = 20,
    manifestFiles = [],
} = {}) {
    this.hashSize = hashSize;
    this.manifestFiles = manifestFiles;
}

function reHashChunk(chunk, assets) {
    const oldHash = chunk.renderedHash;
    const oldChunkName = chunk.files[0];
    const asset = assets[oldChunkName];
    const hash = md5(asset.source());
    const shortHash = hash.substr(0, this.hashSize);
    const newChunkName = oldChunkName.replace(oldHash, shortHash);

    // Update the chunk with the new name
    chunk.hash = hash;
    chunk.renderedHash = shortHash;
    chunk.files[0] = newChunkName;

    // Update the asset associated with that chunk
    asset._name = newChunkName;
    delete assets[oldChunkName];
    assets[newChunkName] = asset;

    return {
        oldHash,
        newHash: shortHash,
    };
}

function replaceHashes(chunk, assets, nameMap) {
    const asset = assets[chunk.files[0]];

    // Replace references to the old chunk names with the new names
    Object.keys(nameMap).forEach((oldHash) => {
        const newHash = nameMap[oldHash];
        if (asset instanceof CachedSource) {
            asset._cachedSource = asset.source().replace(oldHash, newHash);
        } else {
            throw new Error('Unknown asset type!');
            // asset._value = asset._value.replace(oldHash, newHash);
        }
    });
}

OutputHash.prototype.apply = function apply(compiler) {
    compiler.plugin('compilation', (compilation) => {
        // Webpack does not pass chunks and assets to any compilation step, but we need both.
        // To get them, we hook into 'optimize-chunk-assets' and save the chunks for processing
        // them later.
        compilation.plugin('optimize-chunk-assets', (chunks, done) => {
            this.chunks = chunks;
            done();
        });

        compilation.plugin('optimize-assets', (assets, done) => {
            const nameMap = {};

            this.chunks
                // We assume that only the manifest chunk has references to all the other chunks.
                // It needs to be processed at the end, when we know the new names of all the other
                // chunks.
                .filter(chunk => !this.manifestFiles.includes(chunk.name))
                .forEach((chunk) => {
                    const { newHash, oldHash } = reHashChunk(chunk, assets);
                    nameMap[oldHash] = newHash;
                });

            this.chunks
                // Now that we are done with all non-manifest chunks, process the manifest files
                .filter(chunk => this.manifestFiles.includes(chunk.name))
                .forEach((chunk) => {
                    replaceHashes(chunk, assets, nameMap);
                    reHashChunk(chunk, assets);
                });

            done();
        });
    });
};

module.exports = OutputHash;
