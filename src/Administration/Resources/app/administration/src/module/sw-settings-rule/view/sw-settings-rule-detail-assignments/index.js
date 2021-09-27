import template from './sw-settings-rule-detail-assignments.html.twig';
import './sw-settings-rule-detail-assignments.scss';

const { Component, Mixin, Context } = Shopware;
const { Criteria } = Shopware.Data;

Component.register('sw-settings-rule-detail-assignments', {
    template,

    inject: [
        'repositoryFactory',
    ],

    mixins: [
        Mixin.getByName('notification'),
    ],

    props: {
        rule: {
            type: Object,
            required: true,
        },
    },

    data() {
        return {
            associationLimit: 5,
            isLoading: false,
            ruleAssociationsLoaded: false,
            products: null,
            shippingMethods: null,
            paymentMethods: null,
            promotions: null,
            eventActions: null,
            associationSteps: [5, 10],
            associationEntities: null,
            deleteModal: false,
            deleteEntity: null,
            deleteItem: null,
        };
    },

    computed: {
        hasNoAssociations() {
            return this.associationEntities.every((entity) => {
                return entity.loadedData && entity.loadedData.total === 0;
            });
        },

        /* eslint-disable max-len */
        /**
         * Definition of the associated entities of the current rule.
         * The component will render a sw-entity-listing for each association entity,
         * if results are given.
         *
         * @type {[{entityName: String, label: String, api: Function, criteria: Function, detailRoute: String, gridColumns: Array<Object>}]}
         * @returns {Array<Object>}
         */
        /* eslint-enable max-len */
        associationEntitiesConfig() {
            return [
                {
                    id: 'product',
                    allowAdd: false,
                    entityName: 'product',
                    label: this.$tc('sw-settings-rule.detail.associations.products'),
                    criteria: () => {
                        const criteria = new Criteria();
                        criteria.setLimit(this.associationLimit);
                        criteria.addFilter(Criteria.equals('prices.rule.id', this.rule.id));

                        return criteria;
                    },
                    api: () => {
                        const api = Object.assign({}, Context.api);
                        api.inheritance = true;

                        return api;
                    },
                    detailRoute: 'sw.product.detail.prices',
                    gridColumns: [
                        {
                            property: 'name',
                            label: 'Name',
                            rawData: true,
                            sortable: true,
                            routerLink: 'sw.product.detail.prices',
                            allowEdit: false,
                        },
                    ],
                },
                {
                    id: 'shipping_method_availability_rule',
                    allowAdd: true,
                    entityName: 'shipping_method',
                    label: this.$tc('sw-settings-rule.detail.associations.shippingMethodAvailabilityRule'),
                    criteria: () => {
                        const criteria = new Criteria();
                        criteria.setLimit(this.associationLimit);
                        criteria.addFilter(Criteria.equals('availabilityRuleId', this.rule.id));

                        return criteria;
                    },
                    detailRoute: 'sw.settings.shipping.detail',
                    gridColumns: [
                        {
                            property: 'name',
                            label: 'Name',
                            rawData: true,
                            sortable: true,
                            routerLink: 'sw.settings.shipping.detail',
                            allowEdit: false,
                        },
                    ],
                },
                {
                    id: 'shipping_method_prices',
                    allowAdd: false,
                    entityName: 'shipping_method',
                    label: this.$tc('sw-settings-rule.detail.associations.shippingMethodPrices'),
                    criteria: () => {
                        const criteria = new Criteria();
                        criteria.setLimit(this.associationLimit);
                        criteria.addFilter(
                            Criteria.multi(
                                'OR',
                                [
                                    Criteria.equals('prices.ruleId', this.rule.id),
                                    Criteria.equals('prices.calculationRuleId', this.rule.id),
                                ],
                            ),
                        );

                        return criteria;
                    },
                    detailRoute: 'sw.settings.shipping.detail',
                    gridColumns: [
                        {
                            property: 'name',
                            label: 'Name',
                            rawData: true,
                            sortable: true,
                            routerLink: 'sw.settings.shipping.detail',
                            allowEdit: false,
                        },
                    ],
                },
                {
                    id: 'payment_method',
                    allowAdd: true,
                    entityName: 'payment_method',
                    label: this.$tc('sw-settings-rule.detail.associations.paymentMethods'),
                    criteria: () => {
                        const criteria = new Criteria();
                        criteria.setLimit(this.associationLimit);
                        criteria.addFilter(Criteria.equals('availabilityRuleId', this.rule.id));

                        return criteria;
                    },
                    detailRoute: 'sw.settings.payment.detail',
                    gridColumns: [
                        {
                            property: 'name',
                            label: 'Name',
                            rawData: true,
                            sortable: true,
                            routerLink: 'sw.settings.payment.detail',
                            allowEdit: false,
                        },
                    ],
                    deleteContext: {
                        type: 'update',
                        entity: 'payment_method',
                        column: 'availabilityRuleId',
                    },
                },
                {
                    id: 'promotion-order-rule',
                    allowAdd: true,
                    entityName: 'promotion',
                    label: this.$tc('sw-settings-rule.detail.associations.promotionOrderRules'),
                    criteria: () => {
                        const criteria = new Criteria();
                        criteria.setLimit(this.associationLimit);
                        criteria.addFilter(Criteria.equals('orderRules.id', this.rule.id));

                        return criteria;
                    },
                    detailRoute: 'sw.promotion.v2.detail.conditions',
                    gridColumns: [
                        {
                            property: 'name',
                            label: 'Name',
                            rawData: true,
                            sortable: true,
                            routerLink: 'sw.promotion.v2.detail.conditions',
                        },
                    ],
                    deleteContext: {
                        type: 'delete',
                        entity: 'promotion_order_rule',
                        column: 'promotionId',
                    },
                },
                {
                    id: 'promotion-customer-rule',
                    allowAdd: true,
                    entityName: 'promotion',
                    label: this.$tc('sw-settings-rule.detail.associations.promotionCustomerRules'),
                    criteria: () => {
                        const criteria = new Criteria();
                        criteria.setLimit(this.associationLimit);
                        criteria.addFilter(Criteria.equals('personaRules.id', this.rule.id));

                        return criteria;
                    },
                    detailRoute: 'sw.promotion.v2.detail.conditions',
                    gridColumns: [
                        {
                            property: 'name',
                            label: 'Name',
                            rawData: true,
                            sortable: true,
                            routerLink: 'sw.promotion.v2.detail.conditions',
                        },
                    ],
                    deleteContext: {
                        type: 'delete',
                        entity: 'promotion_persona_rule',
                        column: 'promotionId',
                    },
                },
                {
                    id: 'promotion-cart-rule',
                    allowAdd: true,
                    entityName: 'promotion',
                    label: this.$tc('sw-settings-rule.detail.associations.promotionCartRules'),
                    criteria: () => {
                        const criteria = new Criteria();
                        criteria.setLimit(this.associationLimit);
                        criteria.addFilter(Criteria.equals('cartRules.id', this.rule.id));

                        return criteria;
                    },
                    detailRoute: 'sw.promotion.v2.detail.conditions',
                    gridColumns: [
                        {
                            property: 'name',
                            label: 'Name',
                            rawData: true,
                            sortable: true,
                            routerLink: 'sw.promotion.v2.detail.conditions',
                        },
                    ],
                    deleteContext: {
                        type: 'delete',
                        entity: 'promotion_cart_rule',
                        column: 'promotionId',
                    },
                },
                {
                    id: 'promotion-discount-rule',
                    allowAdd: false,
                    entityName: 'promotion',
                    label: this.$tc('sw-settings-rule.detail.associations.promotionDiscountRules'),
                    criteria: () => {
                        const criteria = new Criteria();
                        criteria.setLimit(this.associationLimit);
                        criteria.addFilter(Criteria.equals('discounts.discountRules.id', this.rule.id));

                        return criteria;
                    },
                    detailRoute: 'sw.promotion.v2.detail.conditions',
                    gridColumns: [
                        {
                            property: 'name',
                            label: 'Name',
                            rawData: true,
                            sortable: true,
                            routerLink: 'sw.promotion.v2.detail.conditions',
                        },
                    ],
                },
                {
                    id: 'promotion-group-rule',
                    allowAdd: false,
                    entityName: 'promotion',
                    label: this.$tc('sw-settings-rule.detail.associations.promotionGroupRules'),
                    criteria: () => {
                        const criteria = new Criteria();
                        criteria.setLimit(this.associationLimit);
                        criteria.addFilter(Criteria.equals('setgroups.setGroupRules.id', this.rule.id));

                        return criteria;
                    },
                    detailRoute: 'sw.promotion.v2.detail.conditions',
                    gridColumns: [
                        {
                            property: 'name',
                            label: 'Name',
                            rawData: true,
                            sortable: true,
                            routerLink: 'sw.promotion.v2.detail.conditions',
                        },
                    ],
                },
                {
                    id: 'event_action',
                    allowAdd: true,
                    entityName: 'event_action',
                    label: this.$tc('sw-settings-rule.detail.associations.eventActions'),
                    criteria: () => {
                        const criteria = new Criteria();
                        criteria.setLimit(this.associationLimit);
                        criteria.addFilter(Criteria.equals('rules.id', this.rule.id));

                        return criteria;
                    },
                    detailRoute: 'sw.event.action.detail',
                    gridColumns: [
                        {
                            property: 'eventName',
                            label: 'Business Event',
                            rawData: true,
                            sortable: true,
                            width: '50%',
                            routerLink: 'sw.event.action.detail',
                        },
                        {
                            property: 'title',
                            label: 'Business Event Title',
                            rawData: true,
                            sortable: true,
                            width: '50%',
                            routerLink: 'sw.event.action.detail',
                        },
                    ],
                    deleteContext: {
                        type: 'delete',
                        entity: 'event_action_rule',
                        column: 'eventActionId',
                    },
                },
            ];
        },
    },

    created() {
        this.createdComponent();
    },

    methods: {
        createdComponent() {
            this.prepareAssociationEntitiesList();
            this.loadAssociationData();
        },

        prepareAssociationEntitiesList() {
            this.associationEntities = this.associationEntitiesConfig.map((item) => {
                return {
                    repository: this.repositoryFactory.create(item.entityName),
                    loadedData: null,
                    ...item,
                };
            });
        },

        onOpenDeleteModal(entity, item) {
            this.deleteModal = true;
            this.deleteEntity = entity;
            this.deleteItem = item;
        },

        onCloseDeleteModal() {
            this.deleteModal = false;
            this.deleteContext = null;
            this.deleteItem = null;
        },

        onDelete() {
            if (this.deleteEntity.deleteContext.type === 'update') {
                const api = this.deleteEntity.api ? this.deleteEntity.api() : Context.api;
                const repository = this.repositoryFactory.create(this.deleteItem.getEntityName());

                this.deleteItem[this.deleteEntity.deleteContext.column] = null;


                repository.save(this.deleteItem, api).then(() => {
                    return this.deleteEntity.repository.search(this.deleteEntity.criteria(), api).then((result) => {
                        this.deleteEntity.loadedData = result;
                    });
                });
            } else {
                const api = this.deleteEntity.api ? this.deleteEntity.api() : Context.api;
                const repository = this.repositoryFactory.create(this.deleteEntity.deleteContext.entity);

                repository.sendDeletions([
                    {
                        route: repository.route,
                        key: this.deleteItem.id,
                        entity: this.deleteEntity.deleteContext.entity,
                        primary: {
                            [this.deleteEntity.deleteContext.column]: this.deleteItem.id,
                            ruleId: this.rule.id,
                        },
                    },
                ], api).then(() => {
                    return this.deleteEntity.repository.search(this.deleteEntity.criteria(), api).then((result) => {
                        this.deleteEntity.loadedData = result;
                    });
                });
            }

            this.onCloseDeleteModal();
        },

        onFilterEntity(item, term) {
            const api = item.api ? item.api() : Context.api;
            const criteria = item.criteria();

            criteria.setPage(1);
            criteria.setTerm(term);

            return item.repository.search(criteria, api).then((result) => {
                item.loadedData = result;
            });
        },

        loadAssociationData() {
            this.isLoading = true;

            return Promise
                .all(this.associationEntities.map((item) => {
                    const api = item.api ? item.api() : Context.api;

                    return item.repository.search(item.criteria(), api).then((result) => {
                        item.loadedData = result;
                    });
                }))
                .catch(() => {
                    this.createNotificationError({
                        message: this.$tc('sw-settings-rule.detail.associationsLoadingError'),
                    });
                })
                .finally(() => {
                    this.isLoading = false;
                });
        },
    },
});
