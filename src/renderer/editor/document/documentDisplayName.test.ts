import { describe, expect, it } from 'vitest';
import { documentDisplayName } from './documentDisplayName';

describe('documentDisplayName', () => {
  it('uses the image filename when there is no project path', () => {
    expect(documentDisplayName({ filename: 'photo.png', projectPath: undefined })).toBe(
      'photo.png',
    );
  });

  it('uses the project file basename once a project path is set', () => {
    expect(
      documentDisplayName({
        filename: 'photo.png',
        projectPath: '/Users/me/Documents/holiday.imgedit',
      }),
    ).toBe('holiday.imgedit');
  });

  it('handles a Windows-style backslash path', () => {
    expect(
      documentDisplayName({ filename: 'photo.png', projectPath: 'C:\\Users\\me\\holiday.imgedit' }),
    ).toBe('holiday.imgedit');
  });
});
