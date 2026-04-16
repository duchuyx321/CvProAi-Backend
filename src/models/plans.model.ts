import {
    BeforeUpdate,
    BeforeValidate,
    Column,
    DataType,
    HasMany,
    Model,
    PrimaryKey,
    Table,
} from 'sequelize-typescript';
import { Subscriptions } from '~/models';
import { Helper } from '~/utils/helpers';

@Table({ tableName: 'plans', timestamps: true, underscored: true })
export class Plans extends Model<Plans> {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        allowNull: false,
    })
    declare id: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    name!: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    description?: string;

    @Column({
        type: DataType.BIGINT,
        allowNull: false,
        defaultValue: 0,
    })
    price!: number;

    @Column({
        type: DataType.STRING(10),
        allowNull: false,
        defaultValue: 'VND',
    })
    currency!: string;

    @Column({
        type: DataType.STRING(20),
        allowNull: false,
        defaultValue: 'MONTH',
    })
    billing_cycle!: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 1,
    })
    cv_limit!: number;
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    export_limit!: number;
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    ai_limit!: number;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    })
    premium_template!: boolean;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    })
    remove_watermark!: boolean;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    })
    custom_domain!: boolean;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    })
    priority_support!: boolean;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    })
    is_active!: boolean;
    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    slug!: string;
    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    })
    view_full_ai_analysis!: boolean;
    @HasMany(() => Subscriptions)
    subscriptions?: Subscriptions[];

    // add slug auto
    @BeforeValidate // gọi trước khi tạo
    static makeSlug(newPlans: Plans) {
        const name = newPlans.dataValues.name;
        if (name) {
            const slug = Helper.makeSlugFromString(name);
            newPlans.setDataValue('slug', slug);
        }
    }
    // update
    @BeforeUpdate // gọi trước khi update
    static updateSlug(newPlans: Plans) {
        if (newPlans.changed('name')) {
            const name = newPlans.dataValues.name;
            const slug = Helper.makeSlugFromString(name);
            newPlans.setDataValue('slug', slug);
        }
    }
}
