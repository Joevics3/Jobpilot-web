
import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';

// Redis connection
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

export interface CategoryJobData {
  jobId: string;
  category: string;
  location: {
    city: string;
    state: string;
    country: string;
  };
}

// Create queue
export const categoryQueue = new Queue('category-pages', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
    },
    removeOnFail: {
      count: 50, // Keep last 50 failed jobs
    },
  },
});

// Add job to queue
export async function queueCategoryPageCreation(data: CategoryJobData) {
  try {
    const job = await categoryQueue.add('create-category-page', data, {
      jobId: `category-${data.category}-${data.location.state || 'national'}-${Date.now()}`,
    });
    
    console.log(`✅ Queued category page creation: ${job.id}`);
    return job;
  } catch (error) {
    console.error('❌ Error queuing category page creation:', error);
    throw error;
  }
}

// Bulk add jobs to queue
export async function queueMultipleCategoryPages(jobs: CategoryJobData[]) {
  try {
    const queuedJobs = await categoryQueue.addBulk(
      jobs.map((data, index) => ({
        name: 'create-category-page',
        data,
        opts: {
          jobId: `category-${data.category}-${data.location.state || 'national'}-${Date.now()}-${index}`,
        },
      }))
    );
    
    console.log(`✅ Queued ${queuedJobs.length} category page creations`);
    return queuedJobs;
  } catch (error) {
    console.error('❌ Error queuing multiple category pages:', error);
    throw error;
  }
}