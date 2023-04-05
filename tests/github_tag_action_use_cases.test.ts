/*
  These tests are intended to run against the github-tag-action code.
  These are copied over to the github-tag-action repository and run there.
  They are to demonstrate and prove our specific use case, with a run through our versioning scenario.
  They are perhaps too specific to our case to belong in the github-tag-action repo, but complement the tests within
  that repository.
*/
import action from '../src/action';
import * as utils from '../src/utils';
import * as github from '../src/github';
import * as core from '@actions/core';
import {
  loadDefaultInputs,
  setBranch,
  setCommitSha,
  setInput,
  setRepository,
} from './helper.test';

jest.spyOn(core, 'debug').mockImplementation(() => {});
jest.spyOn(core, 'info').mockImplementation(() => {});
jest.spyOn(console, 'info').mockImplementation(() => {});

beforeAll(() => {
  setRepository('https://github.com', 'org/repo');
});

const mockCreateTag = jest
  .spyOn(github, 'createTag')
  .mockResolvedValue(undefined);

const mockSetOutput = jest
  .spyOn(core, 'setOutput')
  .mockImplementation(() => {});

const mockSetFailed = jest.spyOn(core, 'setFailed');

// describe('semver inc under test conditions', () => {
//   it("Should increment the prerelease part when given a major version", () => {
//     const previousVersion = {
//       options: {},
//       loose: false,
//       includePrerelease: false,
//       raw: "1.0.0",
//       major: 1,
//       minor: 0,
//       patch: 0,
//       prerelease: [],
//       build: [],
//       version: "1.0.0",
//     };
//     const releaseType = "prerelease";
//     const identifier = "dev";

//     const incrementedVersion = sem
//   });
//   // It probably shouldn't mutate previousVersion. But that might not matter.
// });
describe('utils get-latest-prerelease-tag test conditions', () => {
  it("Should detect the most recent dev tag", () => {
    const expectedLatest = {
        name: 'v1.0.0-dev.0',
        commit: { sha: '012345', url: '' },
        zipball_url: '',
        tarball_url: 'string',
        node_id: 'string',
      }
    const validTags = [
      {
        name: 'v1.0.0',
        commit: { sha: '012345', url: '' },
        zipball_url: '',
        tarball_url: 'string',
        node_id: 'string',
      },
      {
        name: 'v1.0.0-rc.0',
        commit: { sha: '012345', url: '' },
        zipball_url: '',
        tarball_url: 'string',
        node_id: 'string',
      },   
      expectedLatest,
      {
        name: 'v0.1.0-dev.0',
        commit: { sha: '012345', url: '' },
        zipball_url: '',
        tarball_url: 'string',
        node_id: 'string',
      },
    ];
    const identifier = 'dev';
    const prefixRegex = /^v/;
    const latestPrereleaseTag = utils.getLatestPrereleaseTag(
      validTags,
      identifier,
      prefixRegex
    );
    expect(latestPrereleaseTag).toBe(expectedLatest);
  });
});

/* terminology -
    getCommits, mocked as commits, returns commits since the latestTag
    latestPrereleaseTag - this will be the last prereleaseTag that has a matching identifier.
      so will only be the `-rc.n` series for an `-rc` identifier.
 */
describe('develop-versioning-process', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setBranch('develop');
    setCommitSha('79e0ea271c26aa152beef77c3275ff7b8f8d8274');
    loadDefaultInputs();
    setInput('default_prerelease_bump', 'prerelease');
    setInput('append_to_pre_release_tag', 'dev');
    /* Unset this */
    setInput('custom_tag', '');
  });

  it("does create initial dev tag", async () => {
    /*
     * Given
     */
    setInput("custom_tag", "0.1.0-dev.0");
    const commits = [
      { message: 'Initial commit', hash: null },
    ];
    jest
      .spyOn(utils, 'getCommits')
      .mockImplementation(async (sha) => commits);
    jest
      .spyOn(utils, 'getValidTags')
      .mockImplementation(async () => []);
    /*
     * When
     */
    await action();
    /*
     * Then
     */
    expect(mockCreateTag).toHaveBeenCalledWith(
      /* TODO: How to make this bump to either v0.1.0-dev.0, or v0.0.0-dev.0? Or is this a manual starting tag? */
      'v0.1.0-dev.0',
      expect.any(Boolean),
      expect.any(String)
    );
    expect(mockSetFailed).not.toBeCalled();
  });

  async function runAndExpectTag(tagName: string, validTags: any) {
    jest
      .spyOn(utils, 'getValidTags')
      .mockImplementation(async () => validTags);
    /*
     * When
     */
    await action();
    /*
     * Then
     */
    expect(mockCreateTag).toHaveBeenCalledWith(
      tagName,
      expect.any(Boolean),
      expect.any(String)
    );
    expect(mockSetFailed).not.toBeCalled();
  }

  it("does increment the next prerelease dev tag", async () => {
    /*
      * Given
      */
    const commits = [
      { message: 'PE-1234: Merged a PR', hash: null },
    ];
    jest
      .spyOn(utils, 'getCommits')
      .mockImplementation(async (sha) => commits);


    const validTags = [
      {
        name: 'v0.1.0-dev.0',
        commit: { sha: '012345', url: '' },
        zipball_url: '',
        tarball_url: 'string',
        node_id: 'string',
      },
    ];
    await runAndExpectTag('v0.1.0-dev.1', validTags);
  });

  // TODO: Additional prerelease test here - with the v1.0.0 and other tags. - do we get v1.0.0-dev.0, and dev.1 after that.
  it("does increment the next prerelease dev tag with v1.0.0 release", async () => {
    /*
      * Given
      */
    const commits = [
      { message: 'PE-1234: Merged a PR', hash: null },
    ];
    jest
      .spyOn(utils, 'getCommits')
      .mockImplementation(async (sha) => commits);


    const validTags = [
      {
        name: 'v1.0.0',
        commit: { sha: '012345', url: '' },
        zipball_url: '',
        tarball_url: 'string',
        node_id: 'string',
      },
      {
        name: 'v1.0.0-rc.0',
        commit: { sha: '012345', url: '' },
        zipball_url: '',
        tarball_url: 'string',
        node_id: 'string',
      },
      {
        name: 'v1.0.0-dev.0',
        commit: { sha: '012345', url: '' },
        zipball_url: '',
        tarball_url: 'string',
        node_id: 'string',
      },
      {
        name: 'v0.1.0-dev.0',
        commit: { sha: '012345', url: '' },
        zipball_url: '',
        tarball_url: 'string',
        node_id: 'string',
      },
    ];
    await runAndExpectTag('v1.0.0-dev.1', validTags);
  });

  it("does create an rc tag - with version bump", async () => {
    /*
     * Given
     */
    setInput('append_to_pre_release_tag', 'rc');
    setInput('default_prerelease_bump', 'minor')
    /* Commits will be since the last valid rc tag */
    const commits: any[] = [
      { message: 'Dev 0 commit', hash: null },
      { message: 'Dev 1 commit', hash: null },
    ];
    jest
      .spyOn(utils, 'getCommits')
      .mockImplementation(async (sha) => commits);


    const validTags = [
      {
        name: 'v0.1.0-rc.0',
        commit: { sha: '012345', url: '' },
        zipball_url: '',
        tarball_url: 'string',
        node_id: 'string',
      },
      {
        name: 'v0.1.0-dev.0',
        commit: { sha: '012345', url: '' },
        zipball_url: '',
        tarball_url: 'string',
        node_id: 'string',
      },
      {
        name: 'v0.1.0-dev.1',
        commit: { sha: '012749', url: '' },
        zipball_url: '',
        tarball_url: 'string',
        node_id: 'string',
      },
    ];
    await runAndExpectTag('v0.2.0-rc.0', validTags);
  });



  it("does create a dev tag with a minor bump", async () => {
    /*
     * Given
     */
    setInput('append_to_pre_release_tag', 'dev');
    setInput('default_prerelease_bump', 'minor')
    /* No commits - we are retagging */
    const commits: any[] = [];
    jest
      .spyOn(utils, 'getCommits')
      .mockImplementation(async (sha) => commits);

    const validTags = [
      {
        name: 'v0.1.0-dev.1',
        commit: { sha: '012357', url: '' },
        zipball_url: '',
        tarball_url: 'string',
        node_id: 'string',
      },
      {
        name: 'v0.2.0-rc.0',
        commit: { sha: '012357', url: '' },
        zipball_url: '',
        tarball_url: 'string',
        node_id: 'string',
      },
    ];
    await runAndExpectTag('v0.2.0-dev.0', validTags);
  });

  it("does promote the rc tag to production", async () => {
    /*
     * Given
     */
    setBranch('main');
    setInput("custom_tag", "2.3.0");
    /* Commits will be everything since the last release to main */
    const commits: any[] = [];
    jest
      .spyOn(utils, 'getCommits')
      .mockImplementation(async (sha) => commits);

    const validTags = [
      {
        name: 'v2.2.0',
        commit: { sha: '012357', url: '' },
        zipball_url: '',
        tarball_url: 'string',
        node_id: 'string',
      },
      {
        name: 'v2.2.0-dev.0',
        commit: { sha: '012360', url: '' },
        zipball_url: '',
        tarball_url: 'string',
        node_id: 'string',
      },
      {
        name: 'v2.3.0-rc.0',
        commit: { sha: '012360', url: '' },
        zipball_url: '',
        tarball_url: 'string',
        node_id: 'string',
      },
      {
        name: 'v2.3.0-dev.0',
        commit: { sha: '012360', url: '' },
        zipball_url: '',
        tarball_url: 'string',
        node_id: 'string',
      },
    ];
    jest
      .spyOn(utils, 'getValidTags')
      .mockImplementation(async () => validTags);
    /*
     * When
     */
    await action();
    /*
     * Then
     */
    expect(mockCreateTag).toHaveBeenCalledWith(
      'v2.3.0',
      expect.any(Boolean),
      expect.any(String)
    );
    expect(mockSetFailed).not.toBeCalled();
  });
});
