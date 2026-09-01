import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getIServerProxyForwardingOptions,
  resolveIServerSceneConfigUrl,
  rewriteIServerProxyPath,
} from '../src/config/iServerProxy.ts'

test('preserves the browser host so iServer tunnel URLs stay same-origin', () => {
  assert.deepEqual(getIServerProxyForwardingOptions(), {
    changeOrigin: false,
    cookiePathRewrite: '/',
  })
})

test('rewrites the legacy attribute index path without dropping its query', () => {
  assert.equal(
    rewriteIServerProxyPath(
      '/supermap-iserver/iserver/services/3D-local/rest/realspace/datas/model/configindexData.dat?token=opaque&v=1',
      '/supermap-iserver',
    ),
    '/iserver/services/3D-local/rest/realspace/datas/model/data/path/indexData.dat?token=opaque&v=1',
  )
})

test('uses the SDK-native /iserver route for local S3M config URLs', () => {
  assert.equal(
    resolveIServerSceneConfigUrl(
      '/supermap-iserver/iserver/services/3D-local/rest/realspace/datas/model/config',
    ),
    '/iserver/services/3D-local/rest/realspace/datas/model/config',
  )
  assert.equal(
    resolveIServerSceneConfigUrl(
      '/iserver/services/3D-local/rest/realspace/datas/model/config',
    ),
    '/iserver/services/3D-local/rest/realspace/datas/model/config',
  )
})
