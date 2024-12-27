import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { AppConfig, validateConfig } from './types';
import logger from '@/src/utils/logger';

// Load environment variables
dotenv.config();

// Check if value is an object
function isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item);
}

// Deep merge utility function
function deepMerge(target: any, source: any): any {
    const output = { ...target };
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] });
                } else {
                    output[key] = deepMerge(target[key], source[key]);
                }
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    return output;
}

export function loadConfig(): AppConfig {
    const env = process.env.NODE_ENV || 'development';
    const configDir = path.join(process.cwd(), 'config');

    // Load default configuration
    const defaultConfigPath = path.join(configDir, 'default.json');
    const envConfigPath = path.join(configDir, `${env}.json`);

    try {
        // Read and parse default config
        const defaultRawConfig = fs.readFileSync(defaultConfigPath, 'utf-8');
        const defaultConfig = JSON.parse(defaultRawConfig);

        // Read and parse environment-specific config (if exists)
        let envConfig = {};
        if (fs.existsSync(envConfigPath)) {
            const envRawConfig = fs.readFileSync(envConfigPath, 'utf-8');
            envConfig = JSON.parse(envRawConfig);
        }

        // Deep merge configurations
        const mergedConfig = deepMerge(defaultConfig, envConfig);

        // Validate configuration
        if (!validateConfig(mergedConfig)) {
            throw new Error('Invalid configuration');
        }

        return mergedConfig as AppConfig;
    } catch (error) {
        logger.error('Failed to load configuration:', { error });
        process.exit(1);
    }
}
