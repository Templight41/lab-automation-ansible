import yaml from 'js-yaml';

interface HostConfig {
    ansible_user: string | undefined;
    ansible_ssh_pass: string | undefined;
    ansible_become: boolean;
    ansible_become_pass: string | undefined;
    ansible_become_user: string | undefined;
}

interface Inventory {
    all: {
        hosts: Record<string, HostConfig>;
    };
}

export const toYaml = (data: Array<any>) => {
    const inventoryContent: Inventory = {
        all: {
            hosts: {}
        }
    };

    data.forEach(item => {
        if (item.address && !inventoryContent.all.hosts[item.address]) {
            inventoryContent.all.hosts[item.address] = {
                ansible_user: process.env.USERNAME,
                ansible_ssh_pass: process.env.PASSWORD,
                ansible_become: true,
                ansible_become_pass: process.env.PASSWORD,
                ansible_become_user: process.env.USERNAME
            };
        }
    });

    return yaml.dump(inventoryContent);
};

