import * as core from '@actions/core';
import { runTaskAsync } from './task';
import 'isomorphic-unfetch';

async function run(): Promise<void> {
  try {
    await runTaskAsync();
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

run();
