<?php declare(strict_types=1);

namespace Shopware\Core\Framework\Api\Sync;

use Doctrine\DBAL\ConnectionException;
use Shopware\Core\Framework\Adapter\Database\ReplicaConnection;
use Shopware\Core\Framework\Api\Exception\InvalidSyncOperationException;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityWriteResult;
use Shopware\Core\Framework\DataAbstractionLayer\Event\EntityWrittenContainerEvent;
use Shopware\Core\Framework\DataAbstractionLayer\Event\EntityWrittenEvent;
use Shopware\Core\Framework\DataAbstractionLayer\Indexing\EntityIndexerRegistry;
use Shopware\Core\Framework\DataAbstractionLayer\Write\EntityWriterInterface;
use Shopware\Core\Framework\DataAbstractionLayer\Write\WriteContext;
use Shopware\Core\Framework\Feature;
use Shopware\Core\Framework\Struct\ArrayEntity;
use Symfony\Contracts\EventDispatcher\EventDispatcherInterface;

/**
 * @package core
 */
class SyncService implements SyncServiceInterface
{
    private EntityWriterInterface $writer;

    private EventDispatcherInterface $eventDispatcher;

    /**
     * @internal
     */
    public function __construct(
        EntityWriterInterface $writer,
        EventDispatcherInterface $eventDispatcher
    ) {
        $this->writer = $writer;
        $this->eventDispatcher = $eventDispatcher;
    }

    /**
     * @param SyncOperation[] $operations
     *
     * @throws ConnectionException
     * @throws InvalidSyncOperationException
     */
    public function sync(array $operations, Context $context, SyncBehavior $behavior): SyncResult
    {
        ReplicaConnection::ensurePrimary();

        $context = clone $context;

        if (\count($behavior->getSkipIndexers())) {
            $context->addExtension(EntityIndexerRegistry::EXTENSION_INDEXER_SKIP, new ArrayEntity($behavior->getSkipIndexers()));
        }

        if (
            $behavior->getIndexingBehavior() !== null
            && \in_array($behavior->getIndexingBehavior(), [EntityIndexerRegistry::DISABLE_INDEXING, EntityIndexerRegistry::USE_INDEXING_QUEUE], true)
        ) {
            $context->addState($behavior->getIndexingBehavior());
        }

        $result = $this->writer->sync($operations, WriteContext::createFromContext($context));

        $writes = EntityWrittenContainerEvent::createWithWrittenEvents($result->getWritten(), $context, []);
        $deletes = EntityWrittenContainerEvent::createWithWrittenEvents($result->getDeleted(), $context, []);

        if ($deletes->getEvents() !== null) {
            $writes->addEvent(...$deletes->getEvents()->getElements());
        }

        $this->eventDispatcher->dispatch($writes);

        $ids = $this->getWrittenEntities($result->getWritten());

        $deleted = $this->getWrittenEntitiesByEvent($deletes);

        $notFound = $this->getWrittenEntities($result->getNotFound());

        //@internal (flag:FEATURE_NEXT_15815) - second construct parameter removed - simply remove if condition and all other code below
        if (Feature::isActive('FEATURE_NEXT_15815')) {
            return new SyncResult($ids, $notFound, $deleted);
        }

        return new SyncResult($ids, true, $notFound, $deleted);
    }

    /**
     * @param array<string, EntityWriteResult[]> $grouped
     *
     * @return array<string, array<int, mixed>>
     */
    private function getWrittenEntities(array $grouped): array
    {
        $mapped = [];

        foreach ($grouped as $entity => $results) {
            foreach ($results as $result) {
                $mapped[$entity][] = $result->getPrimaryKey();
            }
        }

        ksort($mapped);

        return $mapped;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    private function getWrittenEntitiesByEvent(EntityWrittenContainerEvent $result): array
    {
        $entities = [];

        /** @var EntityWrittenEvent $event */
        foreach ($result->getEvents() ?? [] as $event) {
            $entity = $event->getEntityName();

            if (!isset($entities[$entity])) {
                $entities[$entity] = [];
            }

            $entities[$entity] = array_merge($entities[$entity], $event->getIds());
        }

        ksort($entities);

        return $entities;
    }
}
