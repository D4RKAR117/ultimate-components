import type { ProjectConfiguration } from 'nx/src/config/workspace-json-project-json';
import { readCachedProjectGraph, readProjectsConfigurationFromProjectGraph } from 'nx/src/project-graph/project-graph';

type getProjectsOps = (
	selector?: (params: Pick<ProjectConfiguration, 'name' | 'projectType' | 'tags'>) => boolean
) => string[];

/**
 * **Based on** `@commitlint/config-nx-scopes`
 *
 * Gets all scopes
 *
 * @see https://github.com/conventional-changelog/commitlint/tree/master/%40commitlint/config-nx-scopes#commitlintconfig-nx-scopes
 *
 * @param selector the filtering callback to delimite output scopes
 */
export const getScopes: getProjectsOps = (selector = () => true) => {
	const definedScopes = ['project', 'version'];
	try {
		const graph = readCachedProjectGraph();

		const { projects } = readProjectsConfigurationFromProjectGraph(graph);
		const rawProjects = Object.entries(projects || {}).map(([name, project]) => ({
			name,
			...project,
		}));

		// Custom scopes defined for project

		return [
			...definedScopes,
			...rawProjects
				.filter(project =>
					selector({
						name: project.name,
						projectType: project.projectType,
						tags: project.tags,
					})
				)
				.filter(project => project.targets)
				.map(project => project.name)
				.map(name => (name.charAt(0) === '@' ? name.split('/')[1] || `parsed_failed_${name}` : name)),
		];
	} catch (error) {
		console.warn(`NX Graph not found, only defined scopes will be loaded. [ERROR]: ${error}`);
		return definedScopes;
	}
};
