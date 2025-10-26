import { Filter, FindOptions, Sort } from 'mongodb';

// Query optimization utilities
export class QueryOptimizer {
  /**
   * Optimize MongoDB queries for better performance
   */
  public static optimizeQuery<T>(
    filter: Filter<T>,
    options: FindOptions<T> = {}
  ): { filter: Filter<T>; options: FindOptions<T>; hints: string[] } {
    const hints: string[] = [];
    const optimizedFilter = { ...filter };
    const optimizedOptions = { ...options };

    // Optimize projection - only select needed fields
    if (!optimizedOptions.projection) {
      hints.push('Consider adding projection to select only needed fields');
    }

    // Optimize sorting
    if (optimizedOptions.sort) {
      const sortKeys = Object.keys(optimizedOptions.sort);
      if (sortKeys.length > 1) {
        hints.push('Multiple sort fields detected - ensure compound index exists');
      }
    }

    // Optimize limit and skip
    if (optimizedOptions.skip && optimizedOptions.skip > 1000) {
      hints.push('Large skip value detected - consider using cursor-based pagination');
    }

    if (!optimizedOptions.limit || optimizedOptions.limit > 100) {
      optimizedOptions.limit = 100;
      hints.push('Added default limit of 100 for performance');
    }

    // Optimize text search
    if (optimizedFilter.$text) {
      hints.push('Text search detected - ensure text index exists');
    }

    // Optimize regex queries
    Object.keys(optimizedFilter).forEach(key => {
      const value = (optimizedFilter as any)[key];
      if (value && typeof value === 'object' && value.$regex) {
        if (!value.$options || !value.$options.includes('i')) {
          hints.push(`Regex query on ${key} - consider case-insensitive index`);
        }
        if (!value.$regex.startsWith('^')) {
          hints.push(`Regex query on ${key} - anchor with ^ for better performance`);
        }
      }
    });

    return {
      filter: optimizedFilter,
      options: optimizedOptions,
      hints
    };
  }

  /**
   * Create optimized aggregation pipeline
   */
  public static optimizeAggregation(pipeline: any[]): { pipeline: any[]; hints: string[] } {
    const hints: string[] = [];
    const optimizedPipeline = [...pipeline];

    // Move $match stages to the beginning
    const matchStages = optimizedPipeline.filter(stage => stage.$match);
    const otherStages = optimizedPipeline.filter(stage => !stage.$match);
    
    if (matchStages.length > 0) {
      optimizedPipeline.splice(0, optimizedPipeline.length, ...matchStages, ...otherStages);
      hints.push('Moved $match stages to beginning of pipeline for better performance');
    }

    // Add $limit early if not present
    const hasLimit = optimizedPipeline.some(stage => stage.$limit);
    if (!hasLimit) {
      // Add limit after match stages but before expensive operations
      const expensiveStageIndex = optimizedPipeline.findIndex(stage => 
        stage.$lookup || stage.$unwind || stage.$group
      );
      
      if (expensiveStageIndex > -1) {
        optimizedPipeline.splice(expensiveStageIndex, 0, { $limit: 1000 });
        hints.push('Added $limit before expensive operations');
      }
    }

    // Optimize $lookup stages
    optimizedPipeline.forEach((stage, index) => {
      if (stage.$lookup) {
        hints.push(`$lookup at stage ${index} - ensure proper indexes on both collections`);
        
        // Add $match after $lookup if not present
        if (index + 1 < optimizedPipeline.length && !optimizedPipeline[index + 1].$match) {
          hints.push(`Consider adding $match after $lookup at stage ${index} to filter results early`);
        }
      }
    });

    return { pipeline: optimizedPipeline, hints };
  }

  /**
   * Generate index recommendations based on query patterns
   */
  public static recommendIndexes(queries: Array<{ filter: any; sort?: any }>): string[] {
    const recommendations: string[] = [];
    const fieldUsage: Record<string, number> = {};
    const sortFields: Record<string, number> = {};

    // Analyze query patterns
    queries.forEach(query => {
      // Count field usage in filters
      this.analyzeFilterFields(query.filter, fieldUsage);
      
      // Count sort field usage
      if (query.sort) {
        Object.keys(query.sort).forEach(field => {
          sortFields[field] = (sortFields[field] || 0) + 1;
        });
      }
    });

    // Generate recommendations based on usage patterns
    const frequentFields = Object.entries(fieldUsage)
      .filter(([_, count]) => count >= 3)
      .sort(([_, a], [__, b]) => b - a)
      .map(([field]) => field);

    const frequentSortFields = Object.entries(sortFields)
      .filter(([_, count]) => count >= 2)
      .sort(([_, a], [__, b]) => b - a)
      .map(([field]) => field);

    // Single field indexes
    frequentFields.forEach(field => {
      recommendations.push(`Create single field index on: ${field}`);
    });

    // Compound indexes for frequent combinations
    if (frequentFields.length >= 2) {
      recommendations.push(`Consider compound index on: ${frequentFields.slice(0, 3).join(', ')}`);
    }

    // Sort indexes
    frequentSortFields.forEach(field => {
      if (!frequentFields.includes(field)) {
        recommendations.push(`Create index for sorting on: ${field}`);
      }
    });

    return recommendations;
  }

  /**
   * Analyze filter fields recursively
   */
  private static analyzeFilterFields(filter: any, fieldUsage: Record<string, number>, prefix = ''): void {
    if (!filter || typeof filter !== 'object') return;

    Object.keys(filter).forEach(key => {
      if (key.startsWith('$')) {
        // Handle MongoDB operators
        if (key === '$or' || key === '$and') {
          if (Array.isArray(filter[key])) {
            filter[key].forEach((subFilter: any) => {
              this.analyzeFilterFields(subFilter, fieldUsage, prefix);
            });
          }
        }
      } else {
        // Regular field
        const fullFieldName = prefix ? `${prefix}.${key}` : key;
        fieldUsage[fullFieldName] = (fieldUsage[fullFieldName] || 0) + 1;

        // Recursively analyze nested objects
        if (typeof filter[key] === 'object' && !Array.isArray(filter[key])) {
          this.analyzeFilterFields(filter[key], fieldUsage, fullFieldName);
        }
      }
    });
  }

  /**
   * Optimize query for specific collection patterns
   */
  public static optimizeForCollection(
    collection: string,
    filter: any,
    options: any = {}
  ): { filter: any; options: any; hints: string[] } {
    const hints: string[] = [];
    let optimizedFilter = { ...filter };
    let optimizedOptions = { ...options };

    switch (collection) {
      case 'assets':
        // Asset-specific optimizations
        if (filter.department && filter.currentStatus) {
          hints.push('Using compound index: department + currentStatus');
        }
        
        if (filter.$text) {
          optimizedOptions.projection = {
            score: { $meta: 'textScore' },
            assetNumber: 1,
            assetDescription: 1,
            department: 1,
            currentStatus: 1
          };
          optimizedOptions.sort = { score: { $meta: 'textScore' } };
          hints.push('Optimized text search with projection and scoring');
        }
        
        // Default sorting for assets
        if (!optimizedOptions.sort) {
          optimizedOptions.sort = { updatedAt: -1 };
          hints.push('Added default sort by updatedAt');
        }
        break;

      case 'workflows':
        // Workflow-specific optimizations
        if (filter.status && filter.currentAssignees) {
          hints.push('Using compound index: status + currentAssignees');
        }
        
        // Default projection for workflows
        if (!optimizedOptions.projection) {
          optimizedOptions.projection = {
            type: 1,
            status: 1,
            currentStepName: 1,
            requesterName: 1,
            createdAt: 1,
            updatedAt: 1
          };
          hints.push('Added default projection for workflow list');
        }
        break;

      case 'users':
        // User-specific optimizations
        if (filter.role && filter.isActive) {
          hints.push('Using compound index: role + isActive');
        }
        
        // Always exclude password from results
        if (!optimizedOptions.projection) {
          optimizedOptions.projection = { password: 0 };
        } else if (typeof optimizedOptions.projection === 'object') {
          optimizedOptions.projection.password = 0;
        }
        hints.push('Excluded password field from results');
        break;
    }

    return {
      filter: optimizedFilter,
      options: optimizedOptions,
      hints
    };
  }

  /**
   * Create efficient pagination query
   */
  public static createPaginationQuery<T>(
    filter: Filter<T>,
    page: number,
    limit: number,
    sort: Sort = { _id: 1 }
  ): { filter: Filter<T>; options: FindOptions<T>; hints: string[] } {
    const hints: string[] = [];
    
    // Validate pagination parameters
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.min(Math.max(1, limit), 100);
    const skip = (validatedPage - 1) * validatedLimit;

    if (skip > 1000) {
      hints.push('Warning: Large skip value may cause performance issues. Consider cursor-based pagination.');
    }

    if (validatedLimit !== limit) {
      hints.push(`Limit adjusted to ${validatedLimit} for performance`);
    }

    return {
      filter,
      options: {
        sort,
        skip,
        limit: validatedLimit
      },
      hints
    };
  }

  /**
   * Create cursor-based pagination query (more efficient for large datasets)
   */
  public static createCursorPaginationQuery<T>(
    filter: Filter<T>,
    cursor: any,
    limit: number,
    sortField: string = '_id',
    sortDirection: 1 | -1 = 1
  ): { filter: Filter<T>; options: FindOptions<T>; hints: string[] } {
    const hints: string[] = [];
    let paginationFilter = { ...filter };

    if (cursor) {
      const cursorCondition = sortDirection === 1 
        ? { $gt: cursor }
        : { $lt: cursor };
      
      paginationFilter = {
        ...filter,
        [sortField]: cursorCondition
      };
      
      hints.push(`Using cursor-based pagination with ${sortField}`);
    }

    const validatedLimit = Math.min(Math.max(1, limit), 100);

    return {
      filter: paginationFilter,
      options: {
        sort: { [sortField]: sortDirection },
        limit: validatedLimit
      },
      hints
    };
  }
}

// Export utility functions
export const optimizeQuery = QueryOptimizer.optimizeQuery;
export const optimizeAggregation = QueryOptimizer.optimizeAggregation;
export const recommendIndexes = QueryOptimizer.recommendIndexes;
export const optimizeForCollection = QueryOptimizer.optimizeForCollection;
export const createPaginationQuery = QueryOptimizer.createPaginationQuery;
export const createCursorPaginationQuery = QueryOptimizer.createCursorPaginationQuery;