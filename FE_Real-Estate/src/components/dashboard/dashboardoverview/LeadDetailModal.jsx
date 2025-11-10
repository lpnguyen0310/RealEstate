import { useState, useMemo } from 'react';
import { Modal, Table, Avatar, Tag, Button, Empty, Spin, Tooltip, Popconfirm, message } from 'antd';
import { UserOutlined, PhoneOutlined, MailOutlined, ProfileOutlined, EyeOutlined, MessageOutlined, DeleteOutlined } from '@ant-design/icons';
import { useGetMyLeadsQuery, useDeleteLeadMutation } from '@/services/trackingApi';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

// === BƯỚC 1: IMPORT THÊM 2 HÀM NÀY ===
import { useDispatch } from 'react-redux';
import { fetchMyPropertiesThunk } from '@/store/propertySlice';
// ===================================

// ... (Các helper 'formatDate', 'LeadTypeIcon', 'LeadContact' giữ nguyên) ...
const formatDate = (isoString) => {
// ... (code giữ nguyên)
    if (!isoString) return '';
    try {
        return format(parseISO(isoString), 'HH:mm dd/MM/yyyy', { locale: vi });
    } catch (e) {
        return isoString;
    }
};
const LeadTypeIcon = ({ type }) => {
// ... (code giữ nguyên)
    switch (type) {
        case 'VIEW_PHONE':
            return <Tag color="blue" icon={<EyeOutlined />}>Xem SĐT</Tag>;
        case 'ZALO_CLICK':
            return <Tag color="cyan" icon={<MessageOutlined />}>Chat Zalo</Tag>;
        case 'CONTACT_FORM':
            return <Tag color="green" icon={<ProfileOutlined />}>Gửi Form</Tag>;
        default:
            return <Tag>{type}</Tag>;
    }
};
const LeadContact = ({ record }) => {
// ... (code giữ nguyên)
    if (record.registeredUser) { 
        return (
            <div className="flex items-center gap-2">
                <Avatar src={record.leadAvatar} icon={<UserOutlined />} />
                <div>
                    <div className="font-semibold text-blue-600">{record.leadName}</div>
                    <div className="text-xs text-gray-500">{record.leadPhone || record.leadEmail}</div>
                </div>
            </div>
        );
    }
    if (record.leadType === 'CONTACT_FORM') {
        return (
            <div>
                <div className="font-semibold">{record.leadName}</div>
                <div className="text-xs text-gray-500">
                    {record.leadPhone && <><PhoneOutlined className="mr-1" /> {record.leadPhone}</>}
                    {record.leadEmail && <><br /><MailOutlined className="mr-1" /> {record.leadEmail}</>}
                </div>
            </div>
        );
    }
    return (
        <div>
            <div className="font-semibold">{record.leadName}</div>
            <div className="text-xs text-gray-500">IP: {record.ipAddress}</div>
        </div>
    );
};


export default function LeadDetailModal({ visible, onClose, leadType }) {
    const [page, setPage] = useState(0); 
    
    // === BƯỚC 2: KHỞI TẠO DISPATCH ===
    const dispatch = useDispatch();
    // ================================

    const title = leadType === 'sell' 
        ? 'Khách tiềm năng (Tin đăng bán)' 
        : 'Khách tiềm năng (Tin cho thuê)';

    const { data, isLoading, isFetching, error } = useGetMyLeadsQuery(
        { type: leadType, page },
        { skip: !visible }
    );

    const [deleteLead, { isLoading: isDeleting }] = useDeleteLeadMutation();

    const handleDelete = async (leadId) => {
        try {
            await deleteLead(leadId).unwrap();
            message.success("Đã xóa khách hàng tiềm năng.");
            
            // === BƯỚC 3: GỌI THUNK ĐỂ REFRESH DASHBOARD ===
            // Ngay sau khi xóa thành công, báo cho propertySlice tải lại
            dispatch(fetchMyPropertiesThunk({ page: 0, size: 20, sort: "postedAt,desc" }));
            // =============================================

        } catch (err) {
            message.error("Không thể xóa. Bạn không có quyền hoặc đã có lỗi xảy ra.");
        }
    };

    const handleTableChange = (pagination) => {
// ... (code giữ nguyên)
        setPage(pagination.current - 1);
    };
    
    const columns = useMemo(() => [
// ... (code giữ nguyên)
        {
            title: 'Khách hàng',
            dataIndex: 'leadName',
            key: 'lead',
            render: (_, record) => <LeadContact record={record} />
        },
        {
            title: 'Loại liên hệ',
            dataIndex: 'leadType',
            key: 'leadType',
            render: (type) => <LeadTypeIcon type={type} />
        },
        {
            title: 'Tin đăng',
            dataIndex: 'propertyTitle',
            key: 'property',
            render: (title, record) => (
                <a 
                    href={`/real-estate/${record.propertyId}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                >
                    {title || `Tin đăng #${record.propertyId}`}
                </a>
            )
        },
        {
            title: 'Thời gian',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (isoString) => formatDate(isoString)
        },
        {
            title: 'Tin nhắn',
            dataIndex: 'message',
            key: 'message',
            ellipsis: true, 
            render: (text) => text ? (
                <Tooltip title={text}>
                    <span>{text}</span>
                </Tooltip>
            ) : (
                <span className="text-gray-400">...</span>
            )
        },
        {
            title: 'Hành động',
            key: 'action',
            align: 'center',
            render: (_, record) => (
                <Popconfirm
                  title="Xóa khách hàng này?"
                  description="Hành động này không thể hoàn tác."
                  onConfirm={() => handleDelete(record.id)}
                  okText="Xác nhận Xóa"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                >
                  <Button 
                    danger 
                    type="primary" 
                    icon={<DeleteOutlined />} 
                    size="small"
                    loading={isDeleting} 
                  />
                </Popconfirm>
            ),
        },
    ], [isDeleting, dispatch]); // <-- BƯỚC 4: Thêm 'dispatch' vào dependency của useMemo

    // ... (phần còn lại của component giữ nguyên) ...
    const listData = data?.content || [];

    return (
        <Modal
            title={title}
            open={visible}
            onCancel={onClose}
            footer={<Button onClick={onClose}>Đóng</Button>}
            width={1000} 
        >
            <Spin spinning={isLoading || isFetching}>
                {error ? (
                    <Empty description="Không thể tải dữ liệu" />
                ) : (
                    <Table
                        dataSource={listData}
                        columns={columns}
                        rowKey="id"
                        pagination={{
                            current: page + 1, 
                            pageSize: data?.size || 10,
                            total: data?.totalElements || 0,
                            showSizeChanger: false, 
                        }}
                        onChange={handleTableChange}
                        locale={{ emptyText: <Empty description="Không có khách hàng tiềm năng nào" /> }}
                    />
                )}
            </Spin>
        </Modal>
    );
}