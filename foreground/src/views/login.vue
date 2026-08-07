<template>
  <div class="login-container">
    <!-- 左侧SVG图片区域 -->
    <div class="svg-box">
      <img src="../assets/loginChat2.svg" alt="this is chatu" class="login-illustration" />
    </div>

    <!-- 右侧表单区域 -->
    <div class="form-card">
      <h2 class="form-title">Create New Account</h2>

      <div class="divider">
        <span>{{ titleValue }} </span>
      </div>

      <!-- 注册表单 -->
      <el-form :model="formData" :rules="formRules" ref="formRef" class="register-form" label-width="0px">
        <el-form-item prop="username">
          <el-input v-model="formData.username" placeholder="Name" class="custom-input" :disabled="isProcessing" clearable></el-input>
        </el-form-item>

        <el-form-item prop="email">
          <el-input
            v-model="formData.email"
            v-if="isSign"
            placeholder="Email Address"
            type="email"
            class="custom-input"
            :disabled="isProcessing"
            clearable
          ></el-input>
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="formData.password"
            placeholder="Password"
            type="password"
            class="custom-input"
            :disabled="isProcessing"
            show-password
          ></el-input>
        </el-form-item>

        <el-form-item style="margin-top: 30px">
          <el-button class="submit-btn" @click="handleRegister" :loading="isProcessing">
            <template v-if="isProcessing">
              <el-icon>
                <Loading />
              </el-icon>
              <span>Processing...</span>
            </template>
            <template v-else> Create Account </template>
          </el-button>
        </el-form-item>

        <el-form-item class="toggle-section">
          <p>Already have an account?</p>
          <el-button class="toggle-btn" @click="goToLogin" :disabled="isProcessing">
            {{ isSign ? 'Sign In' : 'Sign Up' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="ad-space">
        <p>Advertising space for sale :(</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElForm, ElIcon } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';
const { proxy } = getCurrentInstance();
// 路由实例
const router = useRouter();
const isSign = ref(false);
const titleValue = ref('Tico Studio - Sign In');
// 表单引用
const formRef = ref(null);

// 状态管理
const isProcessing = ref(false); // 控制提交状态

// 表单数据
const formData = reactive({
  username: '',
  email: '',
  password: '',
});

// 表单验证规则
const formRules = reactive({
  username: [
    { required: true, message: 'Please enter your full name', trigger: 'blur' },
    { min: 2, max: 50, message: 'Name must be 2-50 characters', trigger: 'blur' },
    { pattern: /^[a-zA-Z\s]+$/, message: 'Name can only contain letters and spaces', trigger: 'blur' },
  ],
  email: [
    { required: isSign.value, message: 'Please enter your email', trigger: 'blur' },
    { type: 'email', message: 'Please enter a valid email address', trigger: 'blur' },
  ],
  password: [
    { required: true, message: 'Please enter your password', trigger: 'blur' },
    { min: 8, message: 'Password must be at least 8 characters', trigger: 'blur' },
  ],
});

const handleRegister = async () => {
  // 表单验证
  if (!formRef.value) return;
  if (isSign.value) {
    await formRef.value.validate();
    const response = await proxy.$api.user.register(formData);
    if (response.success) ElMessage.success('注册成功');
    else ElMessage.error('注册失败');
  } else {
    // 验证表单
    await formRef.value.validate();
    const response = await proxy.$api.user.login(formData);
    if (response.success) {
      // 存储用户信息和令牌
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('currentUser', JSON.stringify(response.data.user));
      ElMessage.success(`登陆成功`);
      router.push({ name: 'Home' });
    } else ElMessage.error('登录失败');
  }
};

// 跳转到登录页
const goToLogin = () => {
  isSign.value = !isSign.value;
  titleValue.value = isSign.value ? 'Tico Studio - Sign Up' : 'Tico Studio - Sign In';
};
</script>

<style scoped lang="scss">
// 主容器样式
.login-container {
  display: flex;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background-color: #f9fafb;
}

// SVG图片区域样式
.svg-box {
  flex: 7;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;

  .login-illustration {
    width: 80%;
    height: auto;
    max-width: 600px;
    object-fit: contain;
    transition: transform 0.3s ease;

    &:hover {
      transform: scale(1.02);
    }
  }
}

// 表单卡片样式
.form-card {
  flex: 3;
  width: 100%;
  max-width: 400px;
  padding: 2.5rem;
  margin: 2rem;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
  }
}

// 标题样式
.form-title {
  text-align: center;
  margin-bottom: 1.5rem;
  text-decoration: line-through;
  color: #8525fa;
  font-size: 1.8rem;
  font-weight: 600;
}

// 分隔线样式
.divider {
  text-align: center;
  margin: 1.5rem 0;
  position: relative;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 40%;
    height: 1px;
    background-color: #e5e7eb;
  }

  &::before {
    left: 0;
  }

  &::after {
    right: 0;
  }

  span {
    padding: 0 1rem;
    background-color: #fff;
    position: relative;
    z-index: 1;
    color: #9ca3af;
    font-size: 0.9rem;
  }
}

// 表单样式
.register-form {
  width: 100%;
  margin-bottom: 1rem;
}

// 自定义输入框样式
.custom-input {
  --el-input-border-color: transparent;
  --el-input-focus-border-color: transparent;
  border: none !important;
  border-bottom: 1px solid #e5e6eb !important;
  border-radius: 0 !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
  transition: all 0.3s ease;

  &:hover,
  &:focus-within {
    border-bottom-color: #8525fa !important;
    box-shadow: none !important;
  }
}

// 穿透修改Element Plus输入框样式
:deep(.el-input__wrapper) {
  box-shadow: none !important;
  border: none !important;
  padding: 0.5rem 0 !important;
}

// 提交按钮样式
.submit-btn {
  width: 100%;
  height: 45px;
  font-size: 16px;
  border-radius: 8px;
  border: none;
  color: white;
  font-weight: 500;
  background: linear-gradient(90deg, #81b8fc 0%, #8525fa 100%);
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    background: linear-gradient(90deg, #8525fa 0%, #81b8fc 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(133, 37, 250, 0.4);
    color: white;
  }

  &:disabled {
    opacity: 0.8;
    cursor: not-allowed;
  }
}

// 切换表单区域样式
.toggle-section {
  margin-top: 15px;
  text-align: center;

  p {
    margin-bottom: 10px;
    color: #6b7280;
  }
}

// 切换按钮样式
.toggle-btn {
  width: 100%;
  height: 45px;
  font-size: 16px;
  border-radius: 8px;
  border: 1px solid #8525fa;
  color: #8525fa;
  background-color: transparent;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    background-color: rgba(133, 37, 250, 0.1);
    color: #8525fa;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

// 广告位样式
.ad-space {
  text-align: center;
  margin-top: 1.5rem;

  p {
    color: #81b8fc;
    font-size: 0.9rem;
    opacity: 0.8;
  }
}

// 响应式调整
@media (max-width: 992px) {
  .login-container {
    flex-direction: column;
  }

  .svg-box {
    flex: none;
    width: 100%;
    padding: 1rem;
  }

  .form-card {
    flex: none;
    width: 90%;
    max-width: none;
    margin: 1rem auto;
    padding: 1.5rem;
  }
}
</style>
