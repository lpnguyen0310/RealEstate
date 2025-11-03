import { useState, useEffect } from "react";
import axios from "axios";
import { Button, Form, Input, List, Spin, message, Rate, Avatar } from "antd";

// DỮ LIỆU GIẢ (MOCK DATA) ĐỂ TEST GIAO DIỆN
// Bạn có thể xóa đi khi kết nối API thật
const MOCK_COMMENTS = [
  {
    id: 1,
    author: {
      name: "Hoàng Anh",
      avatar: "https://i.pravatar.cc/150?img=11",
    },
    rating: 5,
    content: "Bất động sản này có vị trí rất đẹp, thông tin đăng rõ ràng. Tôi rất hài lòng!",
    createdAt: "2025-10-29T10:30:00Z",
  },
  {
    id: 2,
    author: {
      name: "Minh Thư",
      avatar: "https://i.pravatar.cc/150?img=5",
    },
    rating: 4,
    content: "Giá có vẻ hơi cao so với khu vực, nhưng tiện ích xung quanh thì tuyệt vời.",
    createdAt: "2025-10-28T14:15:00Z",
  },
];

/**
 * Component quản lý và hiển thị bình luận
 * @param {{ postId: string }} props
 */
export default function CommentsSection({ postId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm(); // Hook của Antd để quản lý form

  // Effect để tải danh sách bình luận khi component mount
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        // BẠN SẼ MỞ COMMENT NÀY KHI CÓ API THẬT
        // const response = await axios.get(`http://localhost:8080/api/properties/${postId}/comments`);
        // setComments(response.data);

        // Giả lập gọi API (Xóa khi có API thật)
        setTimeout(() => {
          setComments(MOCK_COMMENTS);
          setLoading(false);
        }, 1000);
      } catch (err) {
        message.error("Không thể tải danh sách bình luận.");
        setLoading(false);
      }
    };

    if (postId) {
      fetchComments();
    }
  }, [postId]);

  // Xử lý khi submit form bình luận mới
  const onFinish = async (values) => {
    // values sẽ có dạng: { rating: 5, content: "Nội dung..." }
    setSubmitting(true);
    try {
      // BẠN SẼ MỞ COMMENT NÀY KHI CÓ API THẬT
      // Giả sử bạn cần gửi thêm userId (lấy từ Context/Redux)
      // const response = await axios.post(`http://localhost:8080/api/properties/${postId}/comments`, {
      //   ...values,
      //   userId: "CURRENT_LOGGED_IN_USER_ID"
      // });
      // const newCommentData = response.data;

      // Giả lập API trả về (Xóa khi có API thật)
      const newCommentData = {
        id: Math.random(),
        author: { name: "Bạn (Người dùng hiện tại)", avatar: "https://i.pravatar.cc/150?img=3" },
        ...values,
        createdAt: new Date().toISOString(),
      };
      //------------------------------------

      setComments((prev) => [newCommentData, ...prev]); // Thêm bình luận mới lên đầu
      form.resetFields(); // Reset form
      message.success("Đã gửi bình luận thành công!");
    } catch (err) {
      message.error("Gửi bình luận thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 p-4 lg:p-6">
      {/* Form gửi bình luận */}
      <h3 className="text-lg font-semibold mb-4">Gửi đánh giá của bạn</h3>
      <Form form={form} onFinish={onFinish} layout="vertical">
        <Form.Item
          name="rating"
          label="Đánh giá chung"
          rules={[{ required: true, message: "Vui lòng chọn số sao" }]}
        >
          <Rate />
        </Form.Item>
        <Form.Item
          name="content"
          label="Nội dung bình luận"
          rules={[{ required: true, message: "Vui lòng nhập nội dung" }]}
        >
          <Input.TextArea
            rows={4}
            placeholder="Cảm nghĩ của bạn về bất động sản này..."
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting}>
            Gửi bình luận
          </Button>
        </Form.Item>
      </Form>

      <div className="border-t border-gray-200 my-6" />

      {/* Danh sách bình luận đã có */}
      <h3 className="text-lg font-semibold mb-4">
        Các bình luận ({comments.length})
      </h3>
      <Spin spinning={loading}>
        <List
          itemLayout="horizontal"
          dataSource={comments}
          renderItem={(item) => (
            <List.Item
              actions={[
                <span key="date" className="text-sm text-gray-500">
                  {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                </span>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar src={item.author.avatar || "/default-avatar.png"} />
                }
                title={
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{item.author.name}</span>
                    {item.rating && (
                      <Rate
                        disabled
                        defaultValue={item.rating}
                        style={{ fontSize: 14 }}
                      />
                    )}
                  </div>
                }
                description={item.content}
              />
            </List.Item>
          )}
        />
        {!loading && comments.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            Chưa có bình luận nào. Hãy là người đầu tiên!
          </div>
        )}
      </Spin>
    </div>
  );
}