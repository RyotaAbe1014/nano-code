FROM oven/bun:1.3

# git curl sudoのみをインストール
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    ca-certificates \
    sudo \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# 非rootユーザーを作成
RUN useradd -ms /bin/bash vscode
RUN usermod -aG sudo vscode \
    && echo "vscode ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/vscode\
    && chmod 0440 /etc/sudoers.d/vscode

USER vscode

WORKDIR /nano-code

# 環境変数
ENV DEVCONTAINER=true
ENV PATH="/home/vscode/.bun/bin:$PATH"

# Bunのキャッシュをユーザーごとに分離
ENV BUN_INSTALL_CACHE_DIR=/home/vscode/.bun-cache
RUN mkdir -p ${BUN_INSTALL_CACHE_DIR}

CMD [ "bash" ]
