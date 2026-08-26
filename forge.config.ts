import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    // Registers the .imgedit project format as a file type macOS can
    // associate with this app (Finder "Open With", double-click, Dock
    // drag). This only wires the declaration into the packaged app's
    // Info.plist — Windows/Linux association registration is a
    // per-installer concern the corresponding makers don't currently
    // configure. The runtime handling for a file opened this way (macOS
    // 'open-file', Windows/Linux launch-argument parsing) lives in
    // src/main/main.ts regardless of whether OS registration is wired up.
    extendInfo: {
      CFBundleDocumentTypes: [
        {
          CFBundleTypeName: 'Image Editor Project',
          CFBundleTypeRole: 'Editor',
          LSItemContentTypes: ['org.corenominal.imageeditor.project'],
          CFBundleTypeExtensions: ['imgedit'],
          LSHandlerRank: 'Owner',
        },
      ],
      UTExportedTypeDeclarations: [
        {
          UTTypeIdentifier: 'org.corenominal.imageeditor.project',
          UTTypeDescription: 'Image Editor Project',
          UTTypeConformsTo: ['public.data', 'public.content'],
          UTTypeTagSpecification: {
            'public.filename-extension': ['imgedit'],
          },
        },
      ],
    },
  },
  rebuildConfig: {},
  makers: [new MakerSquirrel({}), new MakerZIP({}, ['darwin']), new MakerRpm({}), new MakerDeb({})],
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: 'src/main/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
