import {
    BeforeValidate,
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    HasMany,
    Model,
    PrimaryKey,
    Table,
} from 'sequelize-typescript';

import { Ai_runs, Cv_exports, Cvs, Users } from '~/models';

@Table({
    tableName: 'cv_versions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
        {
            unique: true,
            fields: ['cv_id', 'version_no'],
        },
    ],
})
export class Cv_versions extends Model<Cv_versions> {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        allowNull: false,
    })
    declare id: string;

    @ForeignKey(() => Cvs)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    cv_id!: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    version_no!: number;

    @Column({
        type: DataType.JSONB,
        allowNull: false,
    })
    content!: Record<string, any>;
    @Column({
        type: DataType.JSONB,
        allowNull: false,
    })
    custom_config!: Record<string, any>;
    @ForeignKey(() => Users)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    created_by!: string;

    @BelongsTo(() => Cvs)
    cv?: Cvs;

    @BelongsTo(() => Users, 'created_by')
    creator?: Users;

    @HasMany(() => Cv_exports, 'version_id')
    cv_exports?: Cv_exports[];

    @HasMany(() => Ai_runs, 'version_id')
    ai_runs?: Ai_runs[];

    // add version no auto
    @BeforeValidate // gọi trước khi tạo
    static async makeVersionNo(newVersion: Cv_versions) {
        const maxVersionNo = await Cv_versions.max('version_no', {
            where: {
                cv_id: newVersion.dataValues.cv_id,
                created_by: newVersion.dataValues.created_by,
            },
        });
        newVersion.setDataValue(
            'version_no',
            ((maxVersionNo ?? 0) as number) + 1,
        );
    }
}
