// src/tools/init-config.ts
import { initConfig } from '../core/config.js';

export interface InitConfigParams {
  directory?: string;
}

export interface InitConfigToolResult {
  success: boolean;
  created: boolean;
  path: string;
  message: string;
}

export async function initConfigTool(
  params: InitConfigParams = {}
): Promise<InitConfigToolResult> {
  const { directory = '.' } = params;

  try {
    const result = await initConfig(directory);

    if (result.created) {
      return {
        success: true,
        created: true,
        path: result.path,
        message: `Created starter markdownlint config at ${result.path}. You can customize the rules as needed.`,
      };
    } else {
      return {
        success: true,
        created: false,
        path: result.existingPath!,
        message: `Markdownlint config already exists at ${result.existingPath}. No changes made.`,
      };
    }
  } catch (error) {
    return {
      success: false,
      created: false,
      path: '',
      message: `Failed to create config: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
